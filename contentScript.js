chrome.runtime.onMessage.addListener(gotMessage);

function gotMessage(message, sender, sendResponse) {
  if(message === 'ACTIVE') {
    createDialog()
  }
}

function createDialog() {
  let dialog = document.getElementsByClassName('chrome-ex-dialog')[0];

  if(dialog) {
    dialog.classList.toggle('active')
  } else {
    const dialog = document.createElement('DIV');
    dialog.setAttribute('class', 'chrome-ex-dialog active');
    document.body.appendChild(dialog);
  }
}