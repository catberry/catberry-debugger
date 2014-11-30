'use strict';

function inspectInElementsPanel (placeholder) {
	var $element = document.getElementById(placeholder);
	if (!$element) {
		return;
	}

	$element.scrollIntoView();
	inspect($element);
}

function inspectPlaceholder (event) {
	if(event.target && event.target.nodeName === "BUTTON") {
		chrome.devtools.inspectedWindow.eval(
			'(' + inspectInElementsPanel.toString() + ')("' + event.target.getAttribute('data-id') + '")'
		);
	}
}

function addListeners (panelWindow) {
	var $table = panelWindow.document.getElementById('js-catberry-placeholders');
	$table.addEventListener('click', inspectPlaceholder);

	var $logo = panelWindow.document.getElementById('js-catberry-logo');
	$logo.addEventListener('click', function () {
		renderPlaceholders(panelWindow);
	});
}

function renderPlaceholders (panelWindow) {
	chrome.devtools.inspectedWindow.eval(
		'(' + getDebuggerInstance.toString() + ')(null, document).getActivePlaceholders()',
		function (placeholders, error) {
			var $table = panelWindow.document.getElementById('js-catberry-placeholders'),
				content = '';

			placeholders.sort();

			placeholders.forEach(function (placeholder) {
				content += '<li class="item">';
				content += '<button class="right floated compact ui mini orange button" ' +
					'data-id="' + placeholder + '">Inspect</button>';
				content += '<div class="content">' +
						'<div class="header">' + placeholder + '</div>' +
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
			renderPlaceholders(panelWindow);
		});
	});