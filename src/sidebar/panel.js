'use strict';

var SECTIONS = {
		components: 'components',
		stores: 'stores'
	},
	currentSection = SECTIONS.components;

function inspectInElementsPanel (component) {
	var element = document.getElementById(component);
	if (!element) {
		return;
	}

	element.scrollIntoView();
	inspect(element);
}

function inspectComponent (event) {
	if(event.target && event.target.nodeName === "BUTTON") {
		chrome.devtools.inspectedWindow.eval(
			'(' + inspectInElementsPanel.toString() + ')("' + event.target.getAttribute('data-id') + '")'
		);
	}
}

function addListeners (panelWindow) {
	var table = panelWindow.document.getElementById('js-table-components');
	table.addEventListener('click', inspectComponent);

	var refreshElement = panelWindow.document.getElementById('js-refresh');
	refreshElement.addEventListener('click', function () {
		render(panelWindow);
	});

	var navComponents = panelWindow.document.getElementById('js-nav-components');
	navComponents.addEventListener('click', function () {
		render(panelWindow);
		changeSection(panelWindow, SECTIONS.components);
	});

	var navStores = panelWindow.document.getElementById('js-nav-stores');
	navStores.addEventListener('click', function () {
		render(panelWindow);
		changeSection(panelWindow, SECTIONS.stores);
	});
}

function renderComponents (panelWindow) {
	chrome.devtools.inspectedWindow.eval(
		'(' + getDebuggerInstance.toString() + ')(null, document).getActiveComponents()',
		function (components, error) {
			var table = panelWindow.document.getElementById('js-table-components'),
				counter = panelWindow.document.getElementById('js-count-components'),
				content = '';

			components.forEach(function (component) {
				content += '<tr>';
				content += '<td>' + component.name + '</td>';
				content += '<td>' + (component.store ? component.store : '') + '</td>';
				content += '<td>' + component.id + '</td>';
				content += '<td>' + '<button data-id="' + component.id + '">Inspect</button></td>';
				content += '</tr>';
			});

			table.innerHTML = content;
			counter.innerHTML = components.length;
		}
	);
}

function renderStores (panelWindow) {
	chrome.devtools.inspectedWindow.eval(
		'(' + getDebuggerInstance.toString() + ')(null, document).getActiveStores()',
		function (stores, error) {
			var table = panelWindow.document.getElementById('js-table-stores'),
				counter = panelWindow.document.getElementById('js-count-stores'),
				content = '';

			stores.forEach(function (component) {
				content += '<tr>';
				content += '<td>' + component.name + '</td>';
				content += '<td>' + component.components.join(', ') + '</td>';
				content += '</tr>';
			});

			table.innerHTML = content;
			counter.innerHTML = stores.length;
		}
	);
}

function setNewActive (panelWindow, groupClass, activeId) {
	var elements = panelWindow.document.getElementsByClassName(groupClass);
	for (var i = 0; i < elements.length; i++) {
		elements[i].classList.remove('is-active');

		if (elements[i].id === activeId) {
			elements[i].classList.add('is-active');
		}
	}
}

function changeSection (panelWindow, nextSection) {
	if (!SECTIONS.hasOwnProperty(nextSection)) {
		return;
	}

	setNewActive(panelWindow, 'js-tab', 'js-tab-' + nextSection);
	setNewActive(panelWindow, 'js-nav', 'js-nav-' + nextSection);

	currentSection = nextSection;
}

function render (panelWindow) {
	renderComponents(panelWindow);
	renderStores(panelWindow);
}

chrome.devtools.panels.create(
	chrome.i18n.getMessage('sidebarTitle'),
	'icons/icon128.png',
	'panel/index.html',
	function (panel) {
		panel.onShown.addListener(function(panelWindow) {
			addListeners(panelWindow);
			render(panelWindow);
			changeSection(panelWindow, SECTIONS.components);
		});
	});