// define variables
const historyDir = [];
let isBoardTab = false;
let isSelectingLabel = false;

const bmTree = document.querySelector(".bookmark-tree");
const backButton = document.querySelector(".go-back-btn");
const goToBoardButton = document.querySelector(".go-to-board-btn");
const submitLabelButton = document.querySelector(".create-lable-submit-button");
const displayCreateLabelModal = document.querySelector(".create-label-button");
const closeCreateLabelModal = document.querySelector(
  ".label-container-closed-button"
);

const itemList = document.querySelector(".bookmark-items");

const labelContainer = document.querySelector(".label-container");
const bookmarkContainer = document.querySelector(".bookmark-container");
const colorsContainer = document.querySelector(".colors-container");
const boardContainer = document.querySelector(".board-container");

// add Eventlistener
backButton.addEventListener("click", onBack);
goToBoardButton.addEventListener("click", onMoveToBoard);
submitLabelButton.addEventListener("click", onCreateLabel);
displayCreateLabelModal.addEventListener("click", () =>
  labelContainer.classList.toggle("hidden")
);
closeCreateLabelModal.addEventListener("click", () =>
  labelContainer.classList.toggle("hidden")
);

// init DOMTree state

// init storage
chrome.storage.sync.get(["app"], function (result) {
  if (Object.keys(result).length === 0) {
    chrome.storage.sync.set({ app: { colors: [], urls: {} } });
    return;
  }

  const {
    app: { colors },
  } = result;

  // set init labels
  drawColorItem(colors);
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
  if (isBoardTab) {
    toggleTab();
    setCurrentBackButtonLabel();

    return;
  }
  if (historyDir.length === 0) return;

  const currentDir = historyDir.pop();
  setCurrentBackButtonLabel();
  drawBookmarkLayout(currentDir.parentId);
}

function onMoveToBoard() {
  toggleTab();
  backButton.innerHTML = "Back";
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
    chrome.storage.sync.set(
      { app: { ...app, colors: newColors } },
      function () {
        colorsContainer.textContent = "";
        name.value = "";
        drawColorItem(newColors);

        const currentItemID = historyDir[historyDir.length - 1].id;
        drawBookmarkLayout(currentItemID);
      }
    );
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
  bookmarkContainer.classList.toggle("hidden");
  boardContainer.classList.toggle("hidden");
  goToBoardButton.classList.toggle("hidden");
  isBoardTab = !isBoardTab;
}

function toggleCreatingLabel(itemId) {
  const labelWraper = document.querySelector(`.label-wrapper.item-${itemId}`);
  const currentlabel = document.querySelector(`.current-label.item-${itemId}`);
  const captionText = document.querySelector(`.caption-text.item-${itemId}`);
  const addLabelButton = document.querySelector(
    `.add-label-button.item-${itemId}`
  );
  labelWraper.classList.toggle("hidden");
  currentlabel.classList.toggle("hidden");
  captionText.classList.toggle("visibility");

  if (isSelectingLabel) {
    addLabelButton.innerText = "+";
  } else {
    addLabelButton.innerText = "x";
  }

  isSelectingLabel = !isSelectingLabel;
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
    addLabelButton.setAttribute(
      "class",
      `reset-button add-label-button item-${item.id}`
    );
    addLabelButton.innerText = "+";
    addLabelButton.onclick = function () {
      toggleCreatingLabel(item.id);
    };

    const controlWrapper = document.createElement("div");
    controlWrapper.setAttribute("class", `control-wrapper item-${item.id}`);
    const captionText = document.createElement("div");
    captionText.setAttribute(
      "class",
      `caption-text item-${item.id} visibility`
    );
    captionText.innerText = "Click to select/remove the label";
    controlWrapper.appendChild(captionText);
    controlWrapper.appendChild(addLabelButton);

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
    wrapper.appendChild(controlWrapper);
    itemList.appendChild(wrapper);
  }
}

function drawColorItem(
  colors,
  container = colorsContainer,
  item,
  currentLabel
) {

  if (colors.length === 0) {
    const noneLabel = document.createElement("div");
    noneLabel.innerText = "None of labels";
    noneLabel.setAttribute("style", "text-align:center;width:100%");
    container.appendChild(noneLabel);
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
    let {
      app: { urls },
      app,
    } = result;

    // remove label
    const { l, c } = urls[url] || {};
    if (l === payload.l && c === payload.c) {
      delete urls[url];
    } else {
      urls = { ...urls, [url]: payload };
    }

    chrome.storage.sync.set(
      {
        app: { ...app, urls },
      },
      function () {
        const currentItemID = historyDir[historyDir.length - 1].id;
        drawBookmarkLayout(currentItemID);
      }
    );
  });
}
