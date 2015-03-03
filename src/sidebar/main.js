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
	 * Id of selected DOM element
	 * @type {string|null}
	 * @private
	 */
	CatberryDebugger.prototype._elementId = null;

	/**
	 * Catberry's module name
	 * @type {string|null}
	 * @private
	 */
	CatberryDebugger.prototype._moduleName = null;

	/**
	 * Placeholder's name
	 * @type {string|null}
	 * @private
	 */
	CatberryDebugger.prototype._placeholderName = null;

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

		/*this._elementId = null;
		this._moduleName = null;
		this._placeholderName = null;

		if (!domElement) {
			return;
		}
		var id = domElement.getAttribute('id');

		if (!id || !(id in this._locator.getPlaceholdersByIds())) {
			return;
		}

		this._elementId = id;

		var	reg = /^([\w\d-]+)_([\w\d-]+)$/,
			matches = (typeof id === 'string')? id.match(reg) : null;

		this._moduleName = matches ? matches[1] : null;
		this._placeholderName = matches ? matches[2] : null;*/
	};

	/**
	 * Gets data context by placeholder id
	 * @returns {Object|null}
	 */
	CatberryDebugger.prototype.getDataContext = function () {
		if (!this._locator|| !this._moduleName || !this._placeholderName) {
			return null;
		}

		if (!(this._moduleName in this._locator.lastRenderedData)) {
			return null;
		}

		var dc = JSON.parse(JSON.stringify(this._locator
			.lastRenderedData[this._moduleName][this._placeholderName]));

		return this._clearProto(dc);
	};

	/**
	 * Gets module data by moduleName
	 * @returns {Object|null}
	 */
	CatberryDebugger.prototype.getModule = function () {
		if (!this._locator|| !this._moduleName || !this._placeholderName) {
			return null;
		}

		var module = this._locator.getModulesByNames()[this._moduleName];

		if (!module) {
			return null;
		}

		return this._clearProto({
			name: this._moduleName,
			implementation: module.implementation,
			placeholders: this._clearProto(Object.keys(module.placeholders))
		});
	};

	/**
	 * Gets all collected data by DOM element's id
	 * @returns {Object}
	 */
	CatberryDebugger.prototype.getCollectedData = function () {
		return this._clearProto({
			Placeholder: this._elementId,
			DataContext: this.getDataContext(),
			Module: this.getModule()
		});
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

		return activeComponents;
	};

	var catberryDebugger = new CatberryDebugger();
	catberryDebugger.init(selectedDomElement);

	return catberryDebugger;
}

chrome.devtools.panels.elements.createSidebarPane(
	chrome.i18n.getMessage('sidebarTitle'),
	function (sidebar) {
		function updateElementProperties() {
			sidebar.setExpression('(' + getDebuggerInstance.toString() + ')($0, document)' +
				'.getCollectedData()',
				chrome.i18n.getMessage('sidebarTitle'));
		}

		updateElementProperties();
		chrome.devtools.panels.elements
			.onSelectionChanged.addListener(updateElementProperties);
	});