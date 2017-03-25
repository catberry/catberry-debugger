'use strict';

/**
 * Get debugger instance
 * @param {Element} selectedDomElement
 * @param {Document} domDocument
 * @return {Object} instance
 */
function getDebuggerInstance(selectedDomElement, domDocument) {

	class CatberryDebugger {

		/**
		 * Catberry debugger
		 * @constructor
		 */
		constructor() {

			/**
			 * Selected DOM element
			 * @type {Element}
			 * @private
			 */
			this._element = null;

			/**
			 * Collected store data
			 * @type {Object|null}
			 * @private
			 */
			this._collectedStoreData = null;

			/**
			 * Catberry
			 * @type {Object|null}
			 * @private
			 */
			this._catberry = window.catberry;

			/**
			 * Locator in Catberry
			 * @type {Object|null}
			 * @private
			 */

			this._locator = ('catberry' in window) ? window.catberry.locator : null;
		}

		/**
		 * Gets Catberry element id.
		 * @param {Element} element
		 * @returns {string}
		 */
		getElementInnerId(element) {
			return element.$catberryId || element.id;
		}

		/**
		 * Inits data
		 * @param {HTMLElement} domElement
		 */
		init(domElement) {
			if (!this._locator) {
				return;
			}

			this._element = null;

			if (!domElement) {
				return;
			}

			const tagName = domElement.tagName.toLowerCase();

			if (!/^cat-.+/.test(tagName)) {
				return;
			}

			this._element = domElement;
		}

		/**
		 * Gets store data
		 * @returns {Object|null}
		 */
		getStoreData() {
			if (!this._locator || !this._element) {
				return null;
			}

			const storeName = this._element.getAttribute('cat-store');

			return this._locator.resolve('documentRenderer')._storeDispatcher // eslint-disable-line
				.getStoreData(storeName)
				.then(data => {
					this._collectedStoreData = JSON.parse(JSON.stringify(data));
				});
		}

		/**
		 * Gets attributes for element.
		 * @param {Element} element
		 * @returns {Object}
		 */
		getAttributes(element) {
			const attributes = {};
			let attribute;
			for (let i = 0; i < element.attributes.length; i++) {
				attribute = element.attributes[i];
				attributes[attribute.name] = attribute.value;
			}

			return attributes;
		}

		/**
		 * Gets all collected data by DOM element's id
		 * @returns {Object}
		 */
		getCollectedData() {
			if (!this._element) {
				return null;
			}

			const data = {
				component: this._element.tagName.toLowerCase(),
				attributes: this._element.attributes.length ? this.getAttributes(this._element) : null,
				store: this._element.getAttribute('cat-store') ?
				{
					name: this._element.getAttribute('cat-store'),
					state: null,
					data: null
				} : null
			};

			const currentStateMap = this._locator.resolve('stateProvider')
				.getStateByUri(this._locator.resolve('requestRouter')._location); // eslint-disable-line

			if (data.store) {
				data.store.data = this._collectedStoreData;
				data.store.state = currentStateMap[data.store.name] || null;
			}

			return data;
		}

		/**
		 * Gets active components
		 * @returns {Array}
		 */
		getActiveComponents() {
			if (!this._locator) {
				return [];
			}

			const allComponents = this._locator.resolveAll('component')
				.map(component => `cat-${component.name}`);

			let activeComponents = [];
			const self = this;

			allComponents.forEach(component => {
				const elements = domDocument.getElementsByTagName(component);
				const components = [];
				for (let i = 0; i < elements.length; i++) {
					components.push({
						id: self.getElementInnerId(elements[i]),
						element: elements[i],
						store: elements[i].getAttribute('cat-store'),
						name: component,
						attributes: elements[i].attributes.length ? self.getAttributes(elements[i]) : null
					});
				}
				activeComponents = activeComponents.concat(components);
			});

			activeComponents = activeComponents.sort((first, second) => (first.name > second.name) ? 1 : -1);

			return activeComponents;
		}

		/**
		 * Gets active components
		 * @returns {Array}
		 */
		getActiveStores() {
			if (!this._locator) {
				return [];
			}

			let activeStores = [];
			const activeStoresMap = {};
			const activeComponents = this.getActiveComponents();

			activeComponents.forEach(component => {
				if (!component.store) {
					return;
				}

				if (activeStoresMap.hasOwnProperty(component.store)) {
					activeStoresMap[component.store].push(component);
					return;
				}

				activeStoresMap[component.store] = [component];
			});

			Object.keys(activeStoresMap).forEach(storeName => {
				activeStores.push({
					name: storeName,
					components: activeStoresMap[storeName]
				});
			});

			activeStores = activeStores.sort((first, second) => (first.name > second.name) ? 1 : -1);

			return activeStores;
		}

		/**
		 * Gets current state.
		 * @returns {Array}
		 */
		getActiveState() {
			if (!this._locator) {
				return [];
			}

			let currentState = [];

			const currentStateMap = this._locator.resolve('stateProvider')
				.getStateByUri(this._locator.resolve('requestRouter')._location); // eslint-disable-line

			Object.keys(currentStateMap).forEach(storeName => {
				currentState.push({
					store: storeName,
					data: currentStateMap[storeName]
				});
			});

			currentState = currentState.sort((first, second) => (first.store > second.store) ? 1 : -1);

			return currentState;
		}

		/**
		 * Gets routes.
		 * @returns {Array}
		 */
		getActiveRoutes() {
			if (!this._locator) {
				return [];
			}

			let routes = this._locator.resolveAll('routeDefinition');

			routes = routes.map(route => {
				if (typeof route === 'string') {
					return {
						expression: route
					};
				}
				return route;
			});

			routes = routes.sort((first, second) => (first.expression > second.expression) ? 1 : -1);

			return routes;
		}

		/**
		 * Gets version
		 * @returns {string}
		 */
		getVersion() {
			if (!this._catberry) {
				return '';
			}
			return this._catberry.version || '';
		}
	}

	const catberryDebugger = new CatberryDebugger();
	catberryDebugger.init(selectedDomElement);

	return catberryDebugger;
}

chrome.devtools.panels.elements.createSidebarPane(
	chrome.i18n.getMessage('sidebarTitle'),
	sidebar => {

		/**
		 * Update element properties
		 */
		function updateElementProperties() {
			chrome.devtools.inspectedWindow.eval(
				`window.catberryDevToolsSidebar=(${getDebuggerInstance.toString()})($0, document);window.catberryDevToolsSidebar.getStoreData()`,
				(data, error) => {
					setTimeout(() => { // eslint-disable-line
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
