// define variables
const historyDir = [];
let isLabelTab = false;

const bmTree = document.querySelector(".bookmark-tree");
const backButton = document.querySelector(".go-back-btn");
const createLabelButton = document.querySelector(".create-lable-btn");
const submitLabelButton = document.querySelector(".create-lable-submit-button");

const itemList = document.querySelector(".bookmark-items");

const labelContainer = document.querySelector(".label-container");
const bookmarkContainer = document.querySelector(".bookmark-container");
const colorsContainer = document.querySelector(".colors-container");

// add Eventlistener
backButton.addEventListener("click", onBack);
createLabelButton.addEventListener("click", onMoveToLabel);
submitLabelButton.addEventListener("click", onCreateLabel);

// init DOMTree state
labelContainer.setAttribute("class", "hidden");

// get init bookmark tree
chrome.bookmarks.getTree(function (results) {
  createBookmarkTree(results[0].children);
});

function createBookmarkTree(items) {
  bmTree.textContent = "";

  for (let item of items) {
    const button = document.createElement("button");

    button.setAttribute("class", "bookmark-item");
    button.onclick = function () {
      backButton.innerText = item.title;
      historyDir.push(item);

      drawBookmarkLayout(item.id);
    };
    button.innerText = item.title;
    bmTree.appendChild(button);
  }
}

// handle DOM events
function onBack() {
  if (isLabelTab) {
    toggleTab();
    setCurrentBackButtonLabel();

    return;
  }
  if (historyDir.length === 0) return;

  const currentDir = historyDir.pop();
  setCurrentBackButtonLabel();
  drawBookmarkLayout(currentDir.parentId);
}

function onMoveToLabel() {
  toggleTab();
  backButton.innerHTML = "Back";
  colorsContainer.textContent = "";
  chrome.storage.sync.get(["colors"], function (result) {
    if (result.colors && result.colors.length > 0) {
      drawColorItem(result.colors);
    }
  });
}

function onCreateLabel() {
  const name = document.querySelector("#label-name-input");
  const color = document.querySelector("#color-input");

  name.setAttribute("class", "");
  name.addEventListener("blur", function () {
    name.setAttribute("class", "");
  });

  if (!name.value) {
    name.classList.toggle("red-outline");
    return;
  }

  chrome.storage.sync.get(["app"], function (result) {
    const {
      app: { colors },
    } = result;
    const newColors = [...colors, { l: name.value, c: color.value }];
    chrome.storage.sync.set({ app: { colors: newColors } }, function () {
      colorsContainer.textContent = "";
      name.value = "";
      drawColorItem(newColors);
    });
  });
}

// utils
function drawBookmarkLayout(currentItemID) {
  chrome.bookmarks.getChildren(currentItemID, function (result) {
    const folders = result.filter((i) => !i.url);
    const urls = result.filter((i) => i.url);

    createBookmarkTree(folders);
    createBookmarkItem(urls);
  });
}

function setCurrentBackButtonLabel() {
  const { title } = historyDir[historyDir.length - 1] || {};
  backButton.innerText = title ? title : "Root";
}

function toggleTab() {
  labelContainer.classList.toggle("hidden");
  bookmarkContainer.classList.toggle("hidden");
  createLabelButton.classList.toggle("hidden");
  isLabelTab = !isLabelTab;
}

function createBookmarkItem(items) {
  itemList.textContent = "";

  for (let item of items) {
    const wrapper = document.createElement("div");

    const urlWrapper = document.createElement("div");
    urlWrapper.setAttribute("class", "url-wrapper");

    const labelWrapper = document.createElement("div");
    labelWrapper.setAttribute("class", "label-wrapper");

    const addLabelButton = document.createElement("button");
    addLabelButton.setAttribute("class", "reset-button add-label-button");
    addLabelButton.innerText = "+";
    labelWrapper.appendChild(addLabelButton);

    const anchor = document.createElement("a");
    const favIcon = document.createElement("img");

    anchor.href = item.url;
    anchor.target = "_blank";
    anchor.setAttribute("class", "item-url");
    anchor.innerText = item.title;

    wrapper.setAttribute("class", "items-wrapper");
    favIcon.src = `http://www.google.com/s2/favicons?domain=${item.url}`;

    urlWrapper.appendChild(favIcon);
    urlWrapper.appendChild(anchor);
    wrapper.appendChild(urlWrapper);
    wrapper.appendChild(labelWrapper);
    itemList.appendChild(wrapper);
  }
}

function drawColorItem(colors) {
  colors.forEach(({ l, c }) => {
    const coloredItem = document.createElement("div");
    coloredItem.setAttribute("style", `background-color: ${c}`);
    coloredItem.setAttribute("class", "color-item");
    coloredItem.innerText = l;

    const removeBtn = document.createElement("button");
    removeBtn.onclick = function () {
      chrome.storage.sync.get(["colors"], function (result) {
        const { colors } = result;
        const newColors = colors.filter((color) => {
          return JSON.stringify(color) !== JSON.stringify({ c, l });
        });
        chrome.storage.sync.set(
          {
            colors: newColors,
          },
          function () {
            colorsContainer.textContent = "";
            drawColorItem(newColors);
          }
        );
      });
    };
    removeBtn.setAttribute("class", "reset-button remove-label-button");
    removeBtn.innerText = "x";

    coloredItem.appendChild(removeBtn);
    colorsContainer.appendChild(coloredItem);
  });
}
