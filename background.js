chrome.browserAction.onClicked.addListener(buttonClicked);
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  
  chrome.bookmarks.getChildren(msg.id, function (result){
    sendResponse(result);
  })
  return true;
});

function buttonClicked(tab) {
  chrome.bookmarks.getTree(function (results) {
    const message = {
      key: 'ACTIVE',
      payload: results
    }
    chrome.tabs.sendMessage(tab.id, message)
  })
}