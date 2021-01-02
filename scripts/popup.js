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
const closeQuickAddLabel = document.querySelector(
  ".quick-add-label-close-button"
);

const itemList = document.querySelector(".bookmark-items");

const labelContainer = document.querySelector(".label-container");
const bookmarkContainer = document.querySelector(".bookmark-container");
const colorsContainer = document.querySelector(".colors-container");
const quickAddLabels = document.querySelector(".quick-add-labels");
const quickAddLabel = document.querySelector(".quick-add-label");
const boardContainer = document.querySelector(".board-container");
const boardContent = document.querySelector(".board-container-content");
const boardContainerAllLabels = document.querySelector(
  ".board-container-all-labels"
);

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
closeQuickAddLabel.addEventListener("click", () =>
quickAddLabel.classList.toggle("visibility")
);

// init DOMTree state

// init storage
chrome.storage.sync.get(["app"], function (result) {
  console.log("🚀 ~ file: popup.js ~ line 41 ~ result", result);
  if (Object.keys(result).length === 0) {
    chrome.storage.sync.set({
      app: { labels: {}, urls: {}, boardSelectedLabels: [] },
    });
    return;
  }

  const {
    app: { labels, urls },
  } = result;

  drawQuickAdd();
  // set init labels
  drawColorItem(labels);
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
  drawBoard();
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
    let {
      app: { labels },
      app,
    } = result;

    const newLabel = formatLabelName(name.value, color.value);
    labels = { ...labels, [newLabel]: [] };
    chrome.storage.sync.set({ app: { ...app, labels } }, function () {
      colorsContainer.textContent = "";
      name.value = "";
      drawColorItem(labels);

      const { id } = historyDir[historyDir.length - 1] || {};
      drawBookmarkLayout(id);
      drawBoard();
    });
  });
}

function drawQuickAdd() {
  chrome.storage.sync.get(["app"], function (result) {
    const {
      app: { labels, urls },
    } = result;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const { url, title } = tabs[0];

      function onFulfilled(bookmarkItems) {
        if (bookmarkItems.length) {
          const { parentId } = bookmarkItems[0];
          function onQuickAdd(labelName) {
            chrome.bookmarks.get(parentId, function (result) {
              const { title: dir } = result[0];
              addLabelToURL({ title, url, dir }, labelName);
              quickAddLabel.classList.toggle("visibility");
            });
          }

          if (!urls[url]) {
            drawColorItem(
              labels,
              quickAddLabels,
              undefined,
              undefined,
              onQuickAdd
            );
            quickAddLabel.classList.toggle("visibility");
            const urlTitle = document.querySelector(".quick-add-label-url");
            urlTitle.innerText = title;
          }
        } else {
          console.log("active tab is not bookmarked");
        }
      }
      chrome.bookmarks.search({ query: url }, onFulfilled);
    });
  });
}

function drawBoard() {
  boardContainerAllLabels.textContent = "";
  boardContent.textContent = "";

  chrome.storage.sync.get(["app"], function (result) {
    let {
      app: { labels, boardSelectedLabels },
      app,
    } = result;

    if (boardSelectedLabels.length === 0)
      boardContent.innerHTML =
        "<p style='text-align: center;width: 100%;'>Empty board! Let's create some labels and click on the new created label to custom your board.</p>";

    const onSelectLabel = (label) => {
      if (boardSelectedLabels.includes(label)) {
        boardSelectedLabels = boardSelectedLabels.filter((l) => l !== label);
      } else {
        boardSelectedLabels.push(label);
      }
      chrome.storage.sync.set(
        {
          app: { ...app, labels, boardSelectedLabels },
        },
        function () {
          drawBoard();
        }
      );
    };

    drawColorItem(
      labels,
      boardContainerAllLabels,
      undefined,
      boardSelectedLabels,
      onSelectLabel
    );

    boardSelectedLabels.forEach((label) => {
      const labelWrapper = document.createElement("div");
      labelWrapper.setAttribute("class", `label-col item-${label}`);

      const labelTitle = document.createElement("div");
      const [l, c] = destructuringLabelName(label);
      labelTitle.setAttribute("class", `label-col-title item-${label}`);
      labelTitle.setAttribute("style", `background-color:${c}`);
      labelTitle.innerText = l;

      const labelURLWrapper = document.createElement("div");
      labelURLWrapper.setAttribute("class", `label-url-wrapper item-${label}`);

      labelWrapper.appendChild(labelTitle);
      labelWrapper.appendChild(labelURLWrapper);

      const urls = labels[label];
      urls.forEach((url) => {
        const urlItem = document.createElement("a");
        urlItem.setAttribute("class", `label-col-url item-${label}`);
        urlItem.href = url.url;
        urlItem.target = "_blank";
        urlItem.innerText = `[${url.dir}] - ${url.title}`;

        labelURLWrapper.appendChild(urlItem);
      });
      boardContent.appendChild(labelWrapper);
    });
  });
}

function drawBookmarkLayout(currentItemID) {
  if (!currentItemID) return;

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
        app: { labels, urls },
      } = result;
      const currentLabel = urls[item.url];
      drawColorItem(labels, labelWrapper, item, currentLabel);

      if (currentLabel) {
        const currentlabelItem = document.querySelector(
          `.current-label.item-${item.id}`
        );
        drawColorItem({ [currentLabel]: currentLabel }, currentlabelItem);
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
  labels,
  container = colorsContainer,
  item,
  currentLabel = {},
  onItemClick
) {
  const labelNames = Object.keys(labels);

  if (labelNames.length === 0) {
    const noneLabel = document.createElement("div");
    noneLabel.innerText = "None of labels";
    noneLabel.setAttribute("style", "text-align:center;width:100%");
    container.appendChild(noneLabel);
    return;
  }

  labelNames.forEach((labelName) => {
    const [l, c] = destructuringLabelName(labelName);
    const coloredItem = document.createElement("div");
    let isSelectedLabel = false;

    if (currentLabel.length) {
      isSelectedLabel = currentLabel.includes(labelName) ? "selected" : "";
    } else {
      isSelectedLabel =
        currentLabel && currentLabel === labelName ? "selected" : "";
    }

    coloredItem.setAttribute("style", `background-color: ${c}`);
    coloredItem.setAttribute("class", `color-item ${isSelectedLabel}`);
    coloredItem.innerText = l;

    if (onItemClick) {
      coloredItem.onclick = () => {
        onItemClick(labelName);
      };
    } else {
      if (item) {
        coloredItem.onclick = function () {
          addLabelToURL(item, labelName);
          toggleCreatingLabel(item.id);

          const currentlabel = document.querySelector(
            `.current-label.item-${item.id}`
          );
          currentlabel.textContent = "";
          drawColorItem({ [labelName]: labelName }, currentlabel);
        };
      }
    }

    const removeBtn = document.createElement("button");
    removeBtn.onclick = function () {
      chrome.storage.sync.get(["app"], function (result) {
        let {
          app: { labels },
          app,
        } = result;
        delete labels[labelName];

        chrome.storage.sync.set(
          {
            app: { ...app, labels },
          },
          function () {
            colorsContainer.textContent = "";
            drawColorItem(labels);
            const currentItemID = historyDir[historyDir.length - 1].id;
            drawBookmarkLayout(currentItemID);
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

function addLabelToURL(item, labelName) {
  chrome.storage.sync.get(["app"], function (result) {
    let {
      app: { urls, labels },
      app,
    } = result;

    let updatedLabel = {};
    const currentDir = historyDir[historyDir.length - 1] || {};
    // remove label
    const label = urls[item.url];
    if (label === labelName) {
      delete urls[item.url];
      updatedLabel = {
        ...labels,
        [labelName]: labels[labelName].filter((l) => l.url !== item.url),
      };
    } else {
      urls = { ...urls, [item.url]: labelName };
      updatedLabel = {
        ...labels,
        [labelName]: [
          ...labels[labelName],
          {
            title: item.title,
            url: item.url,
            dir: item.dir ? item.dir : currentDir.title,
          },
        ],
      };
    }

    chrome.storage.sync.set(
      {
        app: { ...app, urls, labels: updatedLabel },
      },
      function () {
        const currentItemID = currentDir.id || '0';
        drawBookmarkLayout(currentItemID);
      }
    );
  });
}

function formatLabelName(label, color) {
  return `${label}|${color}`;
}

function destructuringLabelName(name) {
  return name.split("|");
}
