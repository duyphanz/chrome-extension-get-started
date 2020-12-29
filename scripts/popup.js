// define variables
const historyDir = [];
let isLabelTab = false;

const bmTree = document.querySelector('.bookmark-tree')
const backButton = document.querySelector('.go-back-btn')
const createLabelButton = document.querySelector('.create-lable-btn')
const itemList = document.querySelector('.bookmark-items')
const labelContainer = document.querySelector('.label-container')
const bookmarkContainer = document.querySelector('.bookmark-container')

// add Eventlistener
backButton.addEventListener('click', onBack)
createLabelButton.addEventListener('click', onMoveToLabel)

// init DOMTree state
labelContainer.setAttribute('class', 'hidden')

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

      drawBookmarkLayout(item.id)
      
    }
    button.innerText = item.title;
    bmTree.appendChild(button)
  }
}

// handle DOM events
function onBack() {
  if(isLabelTab) {
    toggleTab()
    setCurrentBackButtonLabel()

    return
  }
  if(historyDir.length === 0) return;

  const currentDir = historyDir.pop()
  setCurrentBackButtonLabel()
  drawBookmarkLayout(currentDir.parentId)
}

function onMoveToLabel() {
  toggleTab()
  backButton.innerHTML = 'Back'
}

// utils
function drawBookmarkLayout(currentItemID) {
  chrome.bookmarks.getChildren(currentItemID, function (result){
    const folders = result.filter(i => !i.url)
    const urls = result.filter(i => i.url)

    createBookmarkTree(folders)
    createBookmarkItem(urls)
  })
}

function setCurrentBackButtonLabel() {
  const { title } = historyDir[historyDir.length - 1] || {};
  backButton.innerText = title ? title : 'Root'
}

function toggleTab() {
  labelContainer.classList.toggle('hidden')
  bookmarkContainer.classList.toggle('hidden')
  createLabelButton.classList.toggle('hidden')
  isLabelTab = !isLabelTab
}

function createBookmarkItem(items) {
  itemList.textContent = ''

  for(let item of items) {
    const wrapper = document.createElement('div');
    const anchor = document.createElement('a');
    const favIcon = document.createElement('img');

    anchor.href = item.url
    anchor.target = '_blank'
    anchor.setAttribute('class', 'item-url')
    anchor.innerText = item.title

    wrapper.setAttribute('class', 'items-wrapper')
    favIcon.src= `http://www.google.com/s2/favicons?domain=${item.url}`

    wrapper.appendChild(favIcon)
    wrapper.appendChild(anchor)
    itemList.appendChild(wrapper)
  }
}
