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

	var $logo = panelWindow.document.getElementById('js-catberry-logo');
	$logo.addEventListener('click', function () {
		renderComponents(panelWindow);
	});
}

function renderComponents (panelWindow) {
	chrome.devtools.inspectedWindow.eval(
		'(' + getDebuggerInstance.toString() + ')(null, document).getActiveComponents()',
		function (components, error) {
			alert(JSON.stringify(error));
			var $table = panelWindow.document.getElementById('js-catberry-components'),
				content = '';

			components.sort(function (first, second) {
				return (first.name > second.name) ? 1 : -1;
			});

			components.forEach(function (component) {
				content += '<li class="item">';
				content += '<button class="right floated compact ui mini orange button" ' +
					'data-id="' + component.id + '">Inspect</button>';
				content += '<div class="content">' +
						'<div class="header">' + component.name + '</div>' +
						'#' + component.id + (component.store ? ' ' + component.store : '') +
					'</div>';
				content += '</li>';
			});

			$table.innerHTML = content;
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