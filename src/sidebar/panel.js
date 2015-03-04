'use strict';

function inspectInElementsPanel (placeholder) {
	var $element = document.getElementById(placeholder);
	if (!$element) {
		return;
	}

	$element.scrollIntoView();
	inspect($element);
}

function inspectComponent (event) {
	if(event.target && event.target.nodeName === "BUTTON") {
		chrome.devtools.inspectedWindow.eval(
			'(' + inspectInElementsPanel.toString() + ')("' + event.target.getAttribute('data-id') + '")'
		);
	}
}

function addListeners (panelWindow) {
	var $table = panelWindow.document.getElementById('js-catberry-components');
	$table.addEventListener('click', inspectComponent);

	var $logo = panelWindow.document.getElementById('js-refresh');
	$logo.addEventListener('click', function () {
		renderComponents(panelWindow);
	});
}

function renderComponents (panelWindow) {
	chrome.devtools.inspectedWindow.eval(
		'(' + getDebuggerInstance.toString() + ')(null, document).getActiveComponents()',
		function (components, error) {
			var $table = panelWindow.document.getElementById('js-catberry-components'),
				$count = panelWindow.document.getElementById('js-component-count'),
				content = '';

			components.sort(function (first, second) {
				return (first.name > second.name) ? 1 : -1;
			});

			components.forEach(function (component) {
				content += '<tr>';
				content += '<td>' + component.name + '</td>';
				content += '<td>' + (component.store ? component.store : '') + '</td>';
				content += '<td>' + component.id + '</td>';
				content += '<td>' + '<button data-id="' + component.id + '">Inspect</button></td>';
				content += '</tr>';
			});

			$table.innerHTML = content;
			$count.innerHTML = components.length;
		}
	);
}

chrome.devtools.panels.create(
	chrome.i18n.getMessage('sidebarTitle'),
	'icons/icon128.png',
	'panel/index.html',
	function (panel) {
		panel.onShown.addListener(function(panelWindow) {
			addListeners(panelWindow);
			renderComponents(panelWindow);
		});
	});