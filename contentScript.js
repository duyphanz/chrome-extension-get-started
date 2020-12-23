chrome.runtime.onMessage.addListener(gotMessage);

let bookMarkTree = null;
let breadcrumbs = ['root'];

function gotMessage(message, sender, sendResponse) {
  bookMarkTree = message.payload;
  if(message.key === 'ACTIVE') {
    createDialog()
  }
}

function createDialog() {
  let dialog = document.getElementsByClassName('chrome-ex-dialog')[0];

  if(dialog) {
    dialog.classList.toggle('active')
  } else {
    dialog = document.createElement('DIV');
    dialog.setAttribute('class', 'chrome-ex-dialog active');

    const breadcrumbsEl = document.createElement('P');
    const content = document.createElement('DIV');
    content.setAttribute('class', 'chrome-ex-content');

    dialog.appendChild(breadcrumbsEl)
    dialog.appendChild(content)

    createBookmarkItem(bookMarkTree[0].children, content, breadcrumbsEl)
    document.body.appendChild(dialog);
  }
}

function createBookmarkItem(items, content, breadcrumbsEl) {
  for(let item of items) {
    const button = document.createElement('BUTTON');
    button.setAttribute('class', 'bookmark-item');
    button.onclick = function() {
      content.textContent = '';
      breadcrumbs.push(item.title)
      breadcrumbsEl.innerText = breadcrumbs.join(' > ')
      chrome.runtime.sendMessage({ id: item.id }, function(response) {
        createBookmarkItem(response, content, breadcrumbsEl)
      });
    }
    button.innerText = item.title;
    content.appendChild(button)
  }
}