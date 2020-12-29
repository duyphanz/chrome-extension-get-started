// define variables
const historyDir = [];
const bmTree = document.querySelector('.bookmark-tree')
const backButton = document.querySelector('.go-back-btn')
const itemList = document.querySelector('.bookmark-items')

// add Eventlistener
backButton.addEventListener('click', onBack)


// get init bookmark tree
chrome.bookmarks.getTree(function (results) {
  createBookmarkTree(results[0].children)
})

function createBookmarkTree(items) {
  bmTree.textContent = '';

  for(let item of items) {
    const button = document.createElement('button')

    button.setAttribute('class', 'bookmark-item')
    button.onclick = function() {
      backButton.innerText = item.title;
      historyDir.push(item);

      chrome.bookmarks.getChildren(item.id, function (result){
        console.log("🚀 ~ file: popup.js ~ line 24 ~ result", result)
        const folders = result.filter(i => !i.url)
        const urls = result.filter(i => i.url)

        createBookmarkTree(folders, bmTree)
        createBookmarkItem(urls)
      })
    }
    button.innerText = item.title;
    bmTree.appendChild(button)
  }
}

function createBookmarkItem(items) {
  itemList.textContent = ''

  for(let item of items) {
    const anchor = document.createElement('a');

    anchor.href = item.url
    anchor.target = '_blank'
    anchor.setAttribute('class', 'item-url')
    anchor.innerText = item.title

    itemList.appendChild(anchor)
  }
}

function onBack() {
  if(historyDir.length === 0) return;
  
  const currentDir = historyDir.pop()
  const { title } = historyDir[historyDir.length - 1] || {};
  backButton.innerText = title ? title : 'Root'

  chrome.bookmarks.getChildren(currentDir.parentId, function (result){
    const folders = result.filter(i => !i.url)
    const urls = result.filter(i => i.url)

    createBookmarkTree(folders)
    createBookmarkItem(urls)
  })

}
