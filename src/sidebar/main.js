'use strict';

function getDebuggerInstance (selectedDomElement, domDocument) {

	/**
	 * Catberry debugger
	 * @constructor
	 */
	function CatberryDebugger () {
		this._loader = ('catberry' in window)?
			window.catberry.locator.resolve('moduleLoader') : null;
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
	 * Module loader in Catberry
	 * @type {Object|null}
	 * @private
	 */
	CatberryDebugger.prototype._loader = null;

	/**
	 * Inits data
	 * @param {HTMLElement} domElement
	 */
	CatberryDebugger.prototype.init = function (domElement) {
		if (!this._loader) {
			return;
		}

		this._elementId = null;
		this._moduleName = null;
		this._placeholderName = null;

		if (!domElement) {
			return;
		}
		var id = domElement.getAttribute('id');

		if (!id || !(id in this._loader.getPlaceholdersByIds())) {
			return;
		}

		this._elementId = id;

		var	reg = /^([\w\d-]+)_([\w\d-]+)$/,
			matches = (typeof id === 'string')? id.match(reg) : null;

		this._moduleName = matches ? matches[1] : null;
		this._placeholderName = matches ? matches[2] : null;
	};

	/**
	 * Gets data context by placeholder id
	 * @returns {Object|null}
	 */
	CatberryDebugger.prototype.getDataContext = function () {
		if (!this._loader || !this._moduleName || !this._placeholderName) {
			return null;
		}

		if (!(this._moduleName in this._loader.lastRenderedData)) {
			return null;
		}

		var dc = JSON.parse(JSON.stringify(this._loader
			.lastRenderedData[this._moduleName][this._placeholderName]));

		return this._clearProto(dc);
	};

	/**
	 * Gets module data by moduleName
	 * @returns {Object|null}
	 */
	CatberryDebugger.prototype.getModule = function () {
		if (!this._loader || !this._moduleName || !this._placeholderName) {
			return null;
		}

		var module = this._loader.getModulesByNames()[this._moduleName];

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

	CatberryDebugger.prototype.getActivePlaceholders = function () {
		if (!this._loader) {
			return [];
		}

		var allPlaceholders = Object.keys(this._loader.getPlaceholdersByIds());

		return allPlaceholders.filter(function (placeholder) {
			return (domDocument.getElementById(placeholder) !== null);
		});
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