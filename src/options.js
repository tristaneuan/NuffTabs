// fill in selected options
function init() {
	var maxTabs = localStorage.maxTabs;
	var countTabsPerWindow = localStorage.countTabsPerWindow;
	var discardCriterion = localStorage.discardCriterion;
	var ignorePinned = localStorage.ignorePinned;
	var showCount = localStorage.showCount;
	
	if (!maxTabs && !countTabsPerWindow && !discardCriterion && !ignorePinned && !showCount) {
		return;
	}

	var selector = document.getElementById("maxTabs");
	for (var i = 0; i < selector.children.length; i++) {
		var child = selector.children[i];
		if (child.value == maxTabs) {
			child.selected = "true";
		break;
		}
	}

	var selector = document.getElementById("countTabsPerWindow");
	for (var i = 0; i < selector.children.length; i++) {
		var child = selector.children[i];
		if (child.value == countTabsPerWindow) {
			child.selected = "true";
		break;
		}
	}

	var selector = document.getElementById("discardCriterion");
	for (var i = 0; i < selector.children.length; i++) {
		var child = selector.children[i];
		if (child.value == discardCriterion) {
			child.selected = "true";
		break;
		}
	}

	var selector = document.getElementById("ignorePinned");
	for (var i = 0; i < selector.children.length; i++) {
		var child = selector.children[i];
		if (child.value == ignorePinned) {
			child.selected = "true";
		break;
		}
	}

	var selector = document.getElementById("showCount");
	for (var i = 0; i < selector.children.length; i++) {
		var child = selector.children[i];
		if (child.value == showCount) {
			child.selected = "true";
		break;
		}
	}
}

function save() {
	localStorage.maxTabs = document.getElementById("maxTabs").value;
	localStorage.countTabsPerWindow = document.getElementById("countTabsPerWindow").value;
	localStorage.discardCriterion = document.getElementById("discardCriterion").value;
	localStorage.ignorePinned = document.getElementById("ignorePinned").value;
	localStorage.showCount = document.getElementById("showCount").value;

	document.getElementById('messages').innerHTML = "Options saved.";
}

function saveMe() {
  save();
	setTimeout(function() {
		document.getElementById('messages').innerHTML = "";
	}, 1500);
}

function closeMe() {
	window.close();
}

function saveClose() {
  save();
	setTimeout(function() {
		window.close();
	}, 1000);
}

document.addEventListener('DOMContentLoaded', function () {
	if (document.getElementById('saveButton')) {
		document.getElementById('saveButton').addEventListener('click', saveMe);
	}
	if (document.getElementById('closeButton')) {
		document.getElementById('closeButton').addEventListener('click', closeMe);
	}
	if (document.getElementById('saveCloseButton')) {
		document.getElementById('saveCloseButton').addEventListener('click', saveClose);
	}
});

window.addEventListener("load", init);
