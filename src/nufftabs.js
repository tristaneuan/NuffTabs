// variables
var currentTabId; // ID of currently active tab
var maxTabs; // maximum number of tabs allowed per window or session
var startActive; // time at which active tab started being active
var tabTimes = new Array(); // array with activity times (tab times table)
var bookmarksFolderId;

var debug = true; // debug boolean

function debugLog(string) {
  if (debug) {
    console.log(string);
  }
}

// debug function
function printTimes() {
  //console.log(tabTimes)
  chrome.tabs.query({ }, function(tabs) {
    //debugLog(tabs);
  
    for (var i=0; i <tabs.length; i++) {
      var id = tabs[i].id;
      var ttl = tabs[i].title;
      if (ttl.length>40){
        ttl = ttl.substring(0,40)+"...";
      }
      if (tabTimes[id]) {
        debugLog("ID: " + id + ", last:" + tabTimes[id].lastActive + ", total:" + tabTimes[id].totalActive +" - \""+ttl+"\"");
      }
    }
    debugLog(" ")
  });
}

// initialize
function init() {
  debugLog('INITIALIZING!');

  // set defaults
  if (localStorage.discardCriterion == undefined) {
    localStorage.discardCriterion = 'oldest';
  }
  if (localStorage.maxTabs == undefined) {
    localStorage.maxTabs = 10; // default
  }
  if (localStorage.countTabsPerWindow == undefined) {
    localStorage.countTabsPerWindow = true; // default
  }
  if (localStorage.ignorePinned == undefined) {
    localStorage.ignorePinned = 1;
  }
  if (localStorage.showCount == undefined) {
    localStorage.showCount = 1;
  }
  
  updateCurrentTabId();
  
  // set the usage and last active time for each tab if necessary
  chrome.tabs.query({ }, function(tabs){
    for (var i=0; i <tabs.length; i++) {
      createTimes(tabs[i].id);
    }
    //debugLog(tabTimes);
  });
  
  // start time for activation of current tab
  startActive = Date.now()
  
  updateBadge();

  // bookmarksFolderId = ensureBookmarksFolder();
  ensureBookmarksFolder();
}

// create bookmarks folder if it doesn't exist, and return its id
function ensureBookmarksFolder() {
  var folderProperties = { title: 'NuffTabs Recently Closed Tabs' };
  chrome.bookmarks.search(folderProperties, function(folders) {
    if (folders.length < 1) {
      chrome.bookmarks.create(folderProperties, function(newFolder) {
        // return newFolder.id;
        bookmarksFolderId = newFolder.id;
      });
    } else {
      // return folders[0].id;
      bookmarksFolderId = folders[0].id;
    }
  });
}

// function logBookmarksFolderId() {
//   console.log(bookmarksFolderId);
// }

// add an entry to the tab times table
function createTimes(tabId) {
  tabTimes[tabId] = {totalActive:0, lastActive: Date.now()};
}

// update count on badge
function updateBadge() {
  if (localStorage.showCount == '1'){
    chrome.browserAction.setBadgeBackgroundColor({ color: [0, 0, 0, 92] });
    
    var options = (localStorage.countTabsPerWindow === 'true') ? { lastFocusedWindow: true } : {};
    chrome.tabs.query(options, function(tabs) {
      if (localStorage.ignorePinned == '1') {
        tabs = tabs.filter(function (tab) {
          return !tab.pinned;
        });
      }
      chrome.browserAction.setBadgeText({ text: tabs.length.toString()});
    });
  }
  else {
    chrome.browserAction.setBadgeText({ text: ''});
  }
}

// update active times and current ID
function updateTimesAndId() {
  // update total active time for previous tab
  // debugLog('Previous tab: '+currentTabId);
  if (currentTabId > -1) {
    chrome.tabs.get(currentTabId, function(tab){
      if (tab){
        
        //console.log('Previous tab: ' + currentTabId);
        if (currentTabId > -1) {
          // set last active time
          tabTimes[currentTabId].lastActive = Date.now();
          
          // update total active time
          var duration = Date.now() - startActive;
          debugLog('Adding '+(Math.floor(duration/10)/100)+'s to tab '+currentTabId);
          tabTimes[currentTabId].totalActive = tabTimes[currentTabId].totalActive + duration;
        }
      }
      startActive = Date.now();
      printTimes();
    });
  }
  else {
    startActive = Date.now();
    printTimes();
  }
  
  updateCurrentTabId();
}

// set the ID of the current tab
function updateCurrentTabId() {
  var options = { active: true };
  if (localStorage.countTabsPerWindow === 'true') {
    options.lastFocusedWindow = true;
  }
  chrome.tabs.query(options, function (tabs) {
    if (typeof tabs[0] === 'undefined') {
      currentTabId = -1;
    }
    else {
      currentTabId = tabs[0].id;
      //debugLog("Current: "+currentTabId);
    }
    debugLog('currentTabId: '+currentTabId);
  });
}

// actions to perform upon adding a tab
function checkTabAdded(newTabId) {
  
  // check tabs of current window or session
  var options = (localStorage.countTabsPerWindow === 'true') ? { currentWindow: true } : {};
  chrome.tabs.query(options, function(tabs) {

    if (localStorage.ignorePinned == '1') {
      tabs = tabs.filter(function (tab) {
        return !tab.pinned;
      });
    }
    
    // debugLog("num of tabs: " +tabs.length)
    
    // tab removal criterion
    while (tabs.length > localStorage.maxTabs) {
      debugLog("New tab: "+newTabId)
      debugLog("Preparing to remove tab...")
      printTimes();
      
      var tabInd = 0; // must be overwritten below
      if (tabs[tabInd].id == newTabId) {
        tabInd = 1;
      }
      switch(localStorage.discardCriterion) {

        case 'oldest': // oldest tab
          for (var i=0; i<tabs.length; i++) {
            if (tabs[i].id != newTabId && tabs[i].id != currentTabId) { // exclude new and current
              // find tab with lowest ID
              if (tabs[i].id < tabs[tabInd].id) {
                //tabId = tabs[i].id;
                tabInd = i;
              }
            }
          }
          break;
        
        case 'newest': // newest tab
          for (var i=0; i<tabs.length; i++) {
            // find tab with highest ID
            if (tabs[i].id > tabs[tabInd].id) {
              //tabId = tabs[i].id;
              tabInd = i;
            }
          }
          break;
        
        case 'LRU': // tab with lowest lastActive
          for (var i=0; i<tabs.length; i++) {
            if (tabs[i].id != newTabId && tabs[i].id != currentTabId) { // exclude new and current
              if (tabTimes[tabs[i].id].lastActive < tabTimes[tabs[tabInd].id].lastActive) {
                tabInd = i;
              }
            }
          }
          break;

        case 'LFU': // tab with lowest totalActive
          for (var i=0; i<tabs.length; i++) {
            if (tabs[i].id != newTabId && tabs[i].id != currentTabId) { // exclude new and current
              if (tabTimes[tabs[i].id].totalActive < tabTimes[tabs[tabInd].id].totalActive) {
                tabInd = i;
              }
            }
          }
          break;
        
        case 'random': // random tab
          tabId = newTabId;
          while (tabId == newTabId || tabId == currentTabId) { // exclude new tab
            tabInd = Math.floor(Math.random() * (tabs.length-1));
            tabId = tabs[tabInd].id;
          }
          break;
        default:
      }
      
      var tabId = tabs[tabInd].id;
      
      //debugLog('Chosen: '+tabId)
      chrome.tabs.get(tabId, function(tab){
        debugLog('Removing tab '+tab.id+': "'+tab.title+'", active time '+(Math.floor(tabTimes[tab.id].totalActive/10)/100)+'s, last active: '+tabTimes[tab.id].lastActive);
        addBookmark(tab);
        removeTimes(tab.id);
        printTimes();
      });

      // remove tab
      chrome.tabs.remove(tabId, function() {});
      tabs.splice(tabInd,1); // remove from list
      //removeTimes(tabId);
    }
    updateBadge();
  });
}

// add tab as a bookmark
function addBookmark(tab) {
  var url = tab.url;
  if (url) {
    var options = { parentId: bookmarksFolderId, url: url };
    var title = tab.title;
    if (title) {
      options.title = title;
    }
    chrome.bookmarks.create(options);
  }
  var bookmarks = getBookmarks();
  debugLog('Bookmarks: ' + bookmarks.toString()); // debug
  if (bookmarks.length > 10) { // TODO: make this value configurable
    debugLog('Removing bookmark: ' + bookmarks[0].id);
    chrome.bookmarks.remove(bookmarks[0].id);
  }
}

// get NuffTabs bookmarks sorted by date
function getBookmarks() {
  return chrome.bookmarks.getSubTree(bookmarksFolderId, function(bookmarks) {
    for (var b in bookmarks) {
      debugLog('Bookmark: ' + b);
    }
    // return bookmarks.sort(function(a, b) {
    //   var x = a.dateAdded; var y = b.dateAdded;
    //   return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    // });
  });
  // return bookmarks.sort(function(a, b) {
  //   var x = a.dateAdded; var y = b.dateAdded;
  //   return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  // });
}

// open bookmark in new tab and remove from bookmarks
function visitBookmark(bookmark) {
  chrome.tabs.create({ url: bookmark.url });
  chrome.bookmarks.remove(bookmark.id);
}

// remove entry from tab times table
function removeTimes(tabId) {
  delete tabTimes[tabId];
}

chrome.tabs.onActivated.addListener(function(activeInfo){
  debugLog("tab " + activeInfo.tabId + " activated");
  updateTimesAndId();
  updateBadge();
  // debugLog("Window=" + activeInfo.windowId + ", Tab="+activeInfo.tabId);
});

chrome.tabs.onCreated.addListener(function(tab) {
  debugLog("tab " + tab.id + " created");
  createTimes(tab.id);
  updateTimesAndId();
  checkTabAdded(tab.id); // contains updateBadge
});

chrome.tabs.onRemoved.addListener(function(tabId) {
  debugLog("tab " + tabId + " removed");
  removeTimes(tabId);
  updateTimesAndId();
  updateBadge();
});

chrome.tabs.onDetached.addListener(function(tab) {
  debugLog("tab " + tab.id + " detached");
  updateBadge();
});

chrome.tabs.onAttached.addListener(function(tab) {
  debugLog("tab " + tab.id + " attached");
  checkTabAdded(tab.id); // contains updateBadge
});

chrome.windows.onFocusChanged.addListener(function(windowId) {
  debugLog("window focus changed: "+windowId);
  updateTimesAndId();
  updateBadge();
});

window.addEventListener("load", init);
