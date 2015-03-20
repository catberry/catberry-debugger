'use strict';

var SECTIONS = {
		components: 'components',
		stores: 'stores',
		state: 'state',
		routes: 'routes'
	},
	currentSection = SECTIONS.components;

/**
 * Catberry panel.
 * @param {Object} panelWindow
 * @constructor
 */
function CatberryPanel (panelWindow) {
	this._panelWindow = panelWindow;
	this.addListeners();
	this.render();
}

/**
 * Panel's window
 * @type {Object}
 * @private
 */
CatberryPanel.prototype._panelWindow = null;

/**
 * Add listeners.
 */
CatberryPanel.prototype.addListeners = function () {
	var panelWindow = this._panelWindow,
		self = this;

	var table = panelWindow.document.getElementById('js-content');
	table.addEventListener('click', function (event) {
		if(event.target && event.target.nodeName === "BUTTON") {
			chrome.devtools.inspectedWindow.eval(
				'(' + inspectInElementsPanel.toString() + ')' +
				'("' + event.target.getAttribute('data-id') + '")'
			);
		}
	});

	var refreshElement = panelWindow.document
		.getElementById('js-refresh');
	refreshElement.addEventListener('click', function () {
		self.render();
	});

	Object.keys(SECTIONS).forEach(function (sectionName) {
		var navElement = panelWindow.document
			.getElementById('js-nav-' + SECTIONS[sectionName]);
		navElement.addEventListener('click', function () {
			self.render();
			self.changeSection(SECTIONS[sectionName]);
		});
	});
};

/**
 * Renders components.
 */
CatberryPanel.prototype.renderComponents = function () {
	this._renderTableAndCounter(SECTIONS.components, function (component) {
		var content = '';
		content += '<tr>';
		content += '<td>' + component.name + '</td>';
		content += '<td>' + (component.store ? component.store : '') + '</td>';
		content += '<td>' + component.id + '</td>';
		content += '<td>' + '<button data-id="' + component.id +
			'">Inspect</button></td>';
		content += '</tr>';
		return content;
	});
};

/**
 * Renders stores.
 */
CatberryPanel.prototype.renderStores = function () {
	this._renderTableAndCounter(SECTIONS.stores, function (store) {
		var content = '';
		content += '<tr>';
		content += '<td>' + store.name + '</td>';
		content += '<td>' + store.components.length + ' component' +
			(store.components.length > 1 ? 's' : '') + '</td>';
		content += '<td>' + store.components
			.map(function (component) {
				return component.name + ' <button data-id="' + component.id +
					'">Inspect</button>';
			})
			.join('<br>') + '</td>';
		content += '</tr>';
		return content;
	});
};

/**
 * Renders state.
 */
CatberryPanel.prototype.renderState = function () {
	this._renderTableAndCounter(SECTIONS.state, function (state) {
		var content = '';
		content += '<tr>';
		content += '<td>' + state.store + '</td>';
		content += '<td>' + JSON.stringify(state.data, null, '\t') + '</td>';
		content += '</tr>';
		return content;
	});
};

/**
 * Renders routes.
 */
CatberryPanel.prototype.renderRoutes = function () {
	this._renderTableAndCounter(SECTIONS.routes, function (route) {
		var content = '';
		content += '<tr>';
		content += '<td>' + route.expression + '</td>';
		content += '<td>' + (route.map ? 'true' : '') + '</td>';
		content += '</tr>';
		return content;
	});
};

/**
 * Renders version.
 */
CatberryPanel.prototype.renderVersion = function () {
	var panelWindow = this._panelWindow;

	chrome.devtools.inspectedWindow.eval(
		'(' + getDebuggerInstance.toString() + ')(null, document)' +
		'.getVersion()',
		function (version, error) {
			var versionElement = panelWindow.document
				.getElementById('js-catberry-version');

			versionElement.innerText = 'Project\'s Catberry version: ' + version;
		}
	);
};

/**
 * Renders all.
 */
CatberryPanel.prototype.render = function () {
	this.renderComponents();
	this.renderStores();
	this.renderState();
	this.renderRoutes();
	this.renderVersion();
};

/**
 * Renders table and counter.
 * @param {string} section
 * @param {Function} handler
 * @private
 */
CatberryPanel.prototype._renderTableAndCounter = function (section, handler) {
	var panelWindow = this._panelWindow,
		methodNamePart = section[0].toUpperCase() + section.substring(1);

	chrome.devtools.inspectedWindow.eval(
		'(' + getDebuggerInstance.toString() + ')(null, document)' +
			'.getActive' + methodNamePart + '()',
		function (list, error) {
			var table = panelWindow.document
					.getElementById('js-table-' + section),
				counter = panelWindow.document
					.getElementById('js-count-' + section),
				content = '';

			list.forEach(function (item) {
				content += handler(item);
			});

			table.innerHTML = content;
			counter.innerHTML = list.length;
		}
	);
};

/**
 * Changes active sections.
 * @param {string} nextSection
 */
CatberryPanel.prototype.changeSection = function (nextSection) {
	if (!SECTIONS.hasOwnProperty(nextSection)) {
		return;
	}

	this._setNewActive('js-tab', 'js-tab-' + nextSection);
	this._setNewActive('js-nav', 'js-nav-' + nextSection);

	currentSection = nextSection;
};

/**
 * Sets new active section.
 * @param {string} groupClass
 * @param {string} activeId
 * @private
 */
CatberryPanel.prototype._setNewActive = function (groupClass, activeId) {
	var elements = this._panelWindow.document.getElementsByClassName(groupClass);
	for (var i = 0; i < elements.length; i++) {
		elements[i].classList.remove('is-active');

		if (elements[i].id === activeId) {
			elements[i].classList.add('is-active');
		}
	}
};

function inspectInElementsPanel (id) {
	var element = document.getElementById(id);
	if (!element) {
		return;
	}

	element.scrollIntoView();
	inspect(element);
}

chrome.devtools.panels.create(
	chrome.i18n.getMessage('sidebarTitle'),
	'icons/icon128.png',
	'panel/index.html',
	function (panel) {
		panel.onShown.addListener(function(panelWindow) {
			var catberryPanel = new CatberryPanel(panelWindow);
			catberryPanel.changeSection(SECTIONS.components);
		});
	});