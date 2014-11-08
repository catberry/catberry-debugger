'use strict';

function getCatberryDataContext () {
	var dc = {
		__proto__: null
	};

	if (!$0 || !window.catberry) {
		return dc;
	}

	var id = $0.getAttribute('id');

	if (!id) {
		return dc;
	}

	var	reg = /^([\w\d-]+)_([\w\d-]+)$/,
		matches = (typeof id === 'string')? id.match(reg) : null;

	dc.moduleName = matches ? matches[1] : null;
	dc.placeholderName = matches ? matches[2] : null;

	if (!dc.moduleName || !dc.placeholderName) {
		return dc;
	}

	var loader = window.catberry.locator.resolve('moduleLoader');

	dc.dataContext = JSON.parse(JSON.stringify(
		loader.lastRenderedData[dc.moduleName][dc.placeholderName]));
	dc.dataContext.__proto__ = null;

	return dc;
}

chrome.devtools.panels.elements.createSidebarPane(
	chrome.i18n.getMessage('sidebarTitle'),
	function (sidebar) {
		function updateElementProperties() {
			sidebar.setExpression('(' + getCatberryDataContext.toString() + ')()');
		}

		updateElementProperties();
		chrome.devtools.panels.elements
			.onSelectionChanged.addListener(updateElementProperties);
	});