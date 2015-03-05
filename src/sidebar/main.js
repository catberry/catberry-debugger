'use strict';

function getDebuggerInstance (selectedDomElement, domDocument) {

	/**
	 * Catberry debugger
	 * @constructor
	 */
	function CatberryDebugger () {
		this._locator= ('catberry' in window)?
			window.catberry.locator : null;
	}

	/**
	 * Selected DOM element
	 * @type {Element}
	 * @private
	 */
	CatberryDebugger.prototype._element = null;

	/**
	 * Collected store data
	 * @type {Object|null}
	 * @private
	 */
	CatberryDebugger.prototype._collectedStoreData = null;

	/**
	 * Locator in Catberry
	 * @type {Object|null}
	 * @private
	 */
	CatberryDebugger.prototype._locator= null;

	/**
	 * Inits data
	 * @param {HTMLElement} domElement
	 */
	CatberryDebugger.prototype.init = function (domElement) {
		if (!this._locator) {
			return;
		}

		this._element = null;

		if (!domElement) {
			return;
		}

		var id = domElement.getAttribute('id'),
			tagName = domElement.tagName.toLowerCase();

		if (!/^cat-.+/.test(tagName) || !id) {
			return;
		}

		this._element = domElement;
	};

	/**
	 * Gets store data
	 * @returns {Object|null}
	 */
	CatberryDebugger.prototype.getStoreData = function () {
		if (!this._locator || !this._element) {
			return null;
		}

		var storeName = this._element.getAttribute('cat-store'),
			self = this;

		return this._locator.resolve('documentRenderer')._storeDispatcher
			.getStoreData(storeName)
			.then(function (data) {
				self._collectedStoreData = JSON.parse(JSON.stringify(data));
			});
	};

	/**
	 * Gets all collected data by DOM element's id
	 * @returns {Object}
	 */
	CatberryDebugger.prototype.getCollectedData = function () {
		var data = {
			id: this._element.getAttribute('id'),
			component: this._element.tagName.toLowerCase().substring(4),
			store: this._element.getAttribute('cat-store') ?
				this._clearProto({
					name: this._element.getAttribute('cat-store'),
					data: null
				}) :
				null
		};

		if (data.store) {
			data.store.data = this._clearProto(this._collectedStoreData) || null;
		}

		return this._clearProto(data);
	};

	/**
	 * Clears proto
	 * @param {Object|null} result
	 * @returns {Object|null}
	 * @private
	 */
	CatberryDebugger.prototype._clearProto = function (result) {
		if (result && typeof result === 'object') {
			result.__proto__ = null;
		}

		return result;
	};

	/**
	 * Gets active components
	 * @returns {Array}
	 */
	CatberryDebugger.prototype.getActiveComponents = function () {
		if (!this._locator) {
			return [];
		}

		var allComponents = this._locator.resolveAll('component')
			.map(function (component) {
				return 'cat-' + component.name;
			});

		var activeComponents = [];

		allComponents.forEach(function (component) {
			var elements = domDocument.getElementsByTagName(component),
				components = [];
			for (var i = 0; i < elements.length; i++) {
				components.push({
					id: elements[i].id,
					store: elements[i].getAttribute('cat-store'),
					name: component
				});
			}
			activeComponents = activeComponents.concat(components);
		});

		activeComponents = activeComponents.sort(function (first, second) {
			return (first.name > second.name) ? 1 : -1;
		});

		return activeComponents;
	};

	/**
	 * Gets active components
	 * @returns {Array}
	 */
	CatberryDebugger.prototype.getActiveStores = function () {
		if (!this._locator) {
			return [];
		}

		var activeStores = [],
			activeStoresMap = {},
			activeComponents = this.getActiveComponents();

		activeComponents.forEach(function (component) {
			if (!component.store) {
				return;
			}

			if (activeStoresMap.hasOwnProperty(component.store)) {
				activeStoresMap[component.store].push(component.name);
				return;
			}

			activeStoresMap[component.store] = [component.name];
		});

		Object.keys(activeStoresMap).forEach(function (storeName) {
			activeStores.push({
				name: storeName,
				components: activeStoresMap[storeName]
			});
		});

		activeStores = activeStores.sort(function (first, second) {
			return (first.name > second.name) ? 1 : -1;
		});

		return activeStores;
	};

	var catberryDebugger = new CatberryDebugger();
	catberryDebugger.init(selectedDomElement);

	return catberryDebugger;
}

chrome.devtools.panels.elements.createSidebarPane(
	chrome.i18n.getMessage('sidebarTitle'),
	function (sidebar) {
		function updateElementProperties() {
			chrome.devtools.inspectedWindow.eval(
				'window.catberryDevToolsSidebar=(' + getDebuggerInstance.toString() +
				')($0, document);window.catberryDevToolsSidebar.getStoreData()',
				function (data, error) {
					setTimeout(function () {
						sidebar.setExpression(
							'window.catberryDevToolsSidebar.getCollectedData()',
							chrome.i18n.getMessage('sidebarTitle')
						);
					}, 500);
				}
			);
		}

		updateElementProperties();
		chrome.devtools.panels.elements
			.onSelectionChanged.addListener(updateElementProperties);
	});