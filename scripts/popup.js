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

// init storage
chrome.storage.sync.get(["app"], function (result) {
  if (Object.keys(result).length === 0) {
    chrome.storage.sync.set({ app: { colors: [], urls: {} } });
  }
});

// get init bookmark tree
drawBookmarkLayout("0");

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
  chrome.storage.sync.get(["app"], function (result) {
    const {
      app: { colors },
    } = result;

    if (colors && colors.length > 0) {
      drawColorItem(colors);
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
      app,
    } = result;
    const newColors = [...colors, { l: name.value, c: color.value }];
    chrome.storage.sync.set({ app: { ...app, colors: newColors } }, function () {
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

function toggleCreatingLabel(itemId) {
  const labelWraper = document.querySelector(`.label-wrapper.item-${itemId}`);
  const currentlabel = document.querySelector(`.current-label.item-${itemId}`);
  labelWraper.classList.toggle("hidden");
  currentlabel.classList.toggle("hidden");
}

function createBookmarkItem(items) {
  itemList.textContent = "";
  if (items.length === 0) {
    itemList.innerText = "Empty";
  }

  for (let item of items) {
    const wrapper = document.createElement("div");

    const urlWrapper = document.createElement("div");
    urlWrapper.setAttribute("class", "url-wrapper");

    const labelWrapper = document.createElement("div");
    labelWrapper.setAttribute("class", `label-wrapper item-${item.id} hidden`);
    const currentLabelWrapper = document.createElement("div");
    currentLabelWrapper.setAttribute("class", `current-label item-${item.id}`);

    const addLabelButton = document.createElement("button");
    addLabelButton.setAttribute("class", "reset-button add-label-button");
    addLabelButton.innerText = "+";
    addLabelButton.onclick = function () {
      toggleCreatingLabel(item.id);
    };

    chrome.storage.sync.get(["app"], function (result) {
      const {
        app: { colors, urls },
      } = result;
      const currentLabel = urls[item.url];
      drawColorItem(colors, labelWrapper, item, currentLabel);

      if (currentLabel) {
        const currentlabel = document.querySelector(
          `.current-label.item-${item.id}`
        );
        drawColorItem([currentLabel], currentlabel);
      }
    });

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
    wrapper.appendChild(currentLabelWrapper);
    wrapper.appendChild(addLabelButton);
    itemList.appendChild(wrapper);
  }
}

function drawColorItem(
  colors,
  container = colorsContainer,
  item,
  currentLabel
) {
  
  if(colors.length === 0) {
    container.innerText = 'None of labels'
    return;
  }

  colors.forEach(({ l, c }) => {
    const coloredItem = document.createElement("div");
    const isSelectedLabel =
      currentLabel && JSON.stringify(currentLabel) === JSON.stringify({ c, l })
        ? "selected"
        : "";

    coloredItem.setAttribute("style", `background-color: ${c}`);
    coloredItem.setAttribute("class", `color-item ${isSelectedLabel}`);
    coloredItem.innerText = l;
    if (item) {
      coloredItem.onclick = function () {
        addLabelToURL(item.url, { l, c });
        toggleCreatingLabel(item.id);

        const currentlabel = document.querySelector(
          `.current-label.item-${item.id}`
        );
        currentlabel.textContent = "";
        drawColorItem([{ l, c }], currentlabel);
      };
    }

    const removeBtn = document.createElement("button");
    removeBtn.onclick = function () {
      chrome.storage.sync.get(["app"], function (result) {
        const {
          app: { colors },
          app,
        } = result;
        const newColors = colors.filter((color) => {
          return JSON.stringify(color) !== JSON.stringify({ c, l });
        });
        chrome.storage.sync.set(
          {
            app: { ...app, colors: newColors },
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
    container.appendChild(coloredItem);
  });
}

function addLabelToURL(url, payload) {
  chrome.storage.sync.get(["app"], function (result) {
    const {
      app: { urls },
      app,
    } = result;

    const newUrls = { ...urls, [url]: payload };
    chrome.storage.sync.set(
      {
        app: { ...app, urls: newUrls },
      },
      function () {
        console.log("added label");
      }
    );
  });
}
