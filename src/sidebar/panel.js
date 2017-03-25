'use strict';

const SECTIONS = {
	components: 'components',
	stores: 'stores',
	state: 'state',
	routes: 'routes'
};

let currentSection = SECTIONS.components;

/**
 * Catberry panel.
 * @param {Object} panelWindow
 * @constructor
 */
class CatberryPanel {
	constructor(panelWindow) {

		/**
		 * Panel's window
		 * @type {Object}
		 * @private
		 */
		this._panelWindow = panelWindow;
		this.addListeners();
		this.render();
	}

	/**
	 * Add listeners.
	 */
	addListeners() {
		const panelWindow = this._panelWindow;
		const table = panelWindow.document.getElementById('js-content');

		table.addEventListener('click', event => {
			if (event.target && event.target.nodeName === 'BUTTON') {
				chrome.devtools.inspectedWindow.eval(
					`(${inspectInElementsPanel.toString()})("${event.target.getAttribute('data-tag')}", "${event.target.getAttribute('data-id')}", document)`
				);
			}
		});

		const refreshElement = panelWindow.document.getElementById('js-refresh');
		refreshElement.addEventListener('click', () => this.render());

		Object.keys(SECTIONS).forEach(sectionName => {
			const navElement = panelWindow.document
				.getElementById(`js-nav-${SECTIONS[sectionName]}`);

			navElement.addEventListener('click', () => {
				this.render();
				this.changeSection(SECTIONS[sectionName]);
			});
		});
	}

	/**
	 * Renders components.
	 */
	renderComponents() {
		this._renderTableAndCounter(SECTIONS.components, component => {
			let attributes = '';
			if (component.attributes) {
				Object.keys(component.attributes).forEach(attributeName => {
					if (attributeName === 'cat-store') {
						attributes += `<strong>${attributeName}</strong>`;
					} else {
						attributes += attributeName;
					}
					attributes += `="${component.attributes[attributeName]}"<br/>`;
				});
			}

			return `
<tr>
	<td>${component.name}</td>
	<td>${attributes}</td>
	<td align="center"><button data-id="${component.id}" data-tag="${component.name}">Inspect</button></td>
</tr>`;
		});
	}

	/**
	 * Renders stores.
	 */
	renderStores() {
		this._renderTableAndCounter(SECTIONS.stores, store => {
			const componentsList = store.components
					.map(component => `<div class="component-item"><span>${component.name}</span><button data-id="${component.id}" data-tag="${component.name}">Inspect</button></div>`)
					.join('');
			return `
<tr>
	<td>${store.name}</td>
	<td>${store.components.length} component${store.components.length > 1 ? 's' : ''}</td>
	<td>${componentsList}</td>
</tr>`;
		});
	}

	/**
	 * Renders state.
	 */
	renderState() {
		this._renderTableAndCounter(SECTIONS.state, state => `
<tr>
	<td>${state.store}</td>
	<td>${JSON.stringify(state.data, null, '\t')}</td>
</tr>`);
	}

	/**
	 * Renders routes.
	 */
	renderRoutes() {
		this._renderTableAndCounter(SECTIONS.routes, route => `
<tr>
	<td>${route.expression}</td>
	<td>${route.map instanceof Function ? route.map.toSource() : 'none'}</td>
</tr>`);
	}

	/**
	 * Renders version.
	 */
	renderVersion() {
		const panelWindow = this._panelWindow;

		chrome.devtools.inspectedWindow.eval(
			`(${getDebuggerInstance.toString()})(null, document).getVersion()`,
			(version, error) => {
				const versionElement = panelWindow.document
					.getElementById('js-catberry-version');

				versionElement.innerText = `Project's Catberry version: ${version}`;
			}
		);
	}

	/**
	 * Renders all.
	 */
	render() {
		this.renderComponents();
		this.renderStores();
		this.renderState();
		this.renderRoutes();
		this.renderVersion();
	}

	/**
	 * Renders table and counter.
	 * @param {string} section
	 * @param {Function} handler
	 * @private
	 */
	_renderTableAndCounter(section, handler) {
		const panelWindow = this._panelWindow;
		const methodNamePart = section[0].toUpperCase() + section.substring(1);

		chrome.devtools.inspectedWindow.eval(
			`(${getDebuggerInstance.toString()})(null, document).getActive${methodNamePart}()`,
			(list, error) => {
				const table = panelWindow.document
					.getElementById(`js-table-${section}`);

				const counter = panelWindow.document
					.getElementById(`js-count-${section}`);

				table.innerHTML = list.reduce((content, item) => {
					content += handler(item);
				}, '');
				counter.innerHTML = list.length;
			}
		);
	}

	/**
	 * Changes active sections.
	 * @param {string} nextSection
	 */
	changeSection(nextSection) {
		if (!SECTIONS.hasOwnProperty(nextSection)) {
			return;
		}

		this._setNewActive('js-tab', `js-tab-${nextSection}`);
		this._setNewActive('js-nav', `js-nav-${nextSection}`);

		currentSection = nextSection;
	}

	/**
	 * Sets new active section.
	 * @param {string} groupClass
	 * @param {string} activeId
	 * @private
	 */
	_setNewActive(groupClass, activeId) {
		const elements = this._panelWindow.document.getElementsByClassName(groupClass);
		for (let i = 0; i < elements.length; i++) {
			elements[i].classList.remove('is-active');

			if (elements[i].id === activeId) {
				elements[i].classList.add('is-active');
			}
		}
	}
}

/**
 * Inspect
 * @param tag
 * @param id
 * @param document
 */
function inspectInElementsPanel(tag, id, document) {
	let element = null;
	let innerId;

	const elementsByTag = document.getElementsByTagName(tag);
	for (let i = 0; i < elementsByTag.length; i++) {
		innerId = elementsByTag[i].$catberryId || elementsByTag[i].id;
		if (innerId === id) {
			element = elementsByTag[i];
			break;
		}
	}

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
	panel => {
		panel.onShown.addListener(panelWindow => {
			const catberryPanel = new CatberryPanel(panelWindow);
			catberryPanel.changeSection(SECTIONS.components);
		});
	});
