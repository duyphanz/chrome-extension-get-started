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
  quickAddLabel.classList.toggle("hidden")
);

// init storage
BookLabel.getStorage((result) => {
  if (!result.app || Object.keys(result).length === 0) {
    BookLabel.setStorage({ labels: {}, urls: {}, boardSelectedLabels: [] });
    return;
  }

  const { labels } = result;
  drawQuickAdd();
  drawColorItem(labels, colorsContainer);
});

// START HERE:
drawBookmarkLayout("0");

function createBookmarkTree(items) {
  bmTree.textContent = "";

  for (let item of items) {
    function onFolderClick() {
      backButton.innerText = item.title;
      historyDir.push(item);

      drawBookmarkLayout(item.id);
    }

    BookLabel.createDOMElement("button", {
      className: "bookmark-item",
      innerText: item.title,
      onClick: onFolderClick,
      parentEl: bmTree,
    });
  }
}

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

  BookLabel.getStorage((result) => {
    let { labels } = result;

    const newLabel = BookLabel.formatLabelName(name.value, color.value);
    labels = { ...labels, [newLabel]: [] };

    BookLabel.setStorage({ labels }, () => {
      colorsContainer.textContent = "";
      name.value = "";
      drawColorItem(labels);

      drawCurrentBookmarkLayout();
      drawBoard();
    });
  });
}

function drawQuickAdd() {
  BookLabel.getStorage((result) => {
    const { labels, urls } = result;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const { url, title } = tabs[0];
      chrome.bookmarks.search({ query: url }, onFulfilled);

      function onFulfilled(bookmarkItems) {
        if (bookmarkItems.length) {
          const { parentId } = bookmarkItems[0];
          function onQuickAdd(labelName) {
            chrome.bookmarks.get(parentId, function (result) {
              const { title: dir } = result[0];
              addLabelToURL({ title, url, dir }, labelName);
              quickAddLabel.classList.toggle("hidden");
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
            quickAddLabel.classList.toggle("hidden");
            const urlTitle = document.querySelector(".quick-add-label-url");
            urlTitle.innerText = title;
          }
        } else {
          console.log("active tab is not bookmarked");
        }
      }
    });
  });
}

function drawBoard() {
  boardContainerAllLabels.textContent = "";
  boardContent.textContent = "";

  BookLabel.getStorage((result) => {
    let { labels, boardSelectedLabels } = result;

    if (boardSelectedLabels.length === 0)
      boardContent.innerHTML =
        "<p style='text-align: center;width: 100%;'>Empty board! Let's create some labels and click on the new created label to custom your board.</p>";

    const onSelectLabel = (label) => {
      if (boardSelectedLabels.includes(label)) {
        boardSelectedLabels = boardSelectedLabels.filter((l) => l !== label);
      } else {
        boardSelectedLabels.push(label);
      }
      BookLabel.setStorage(
        {
          labels,
          boardSelectedLabels,
        },
        () => {
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
      const labelWrapper = BookLabel.createDOMElement("div", {
        className: `label-col item-${label}`,
        parentEl: boardContent,
      });

      const [l, c] = BookLabel.destructuringLabelName(label);

      BookLabel.createDOMElement("div", {
        className: `label-col-title item-${label}`,
        style: `background-color:${c}`,
        innerText: l,
        parentEl: labelWrapper,
      });

      const labelURLWrapper = BookLabel.createDOMElement("div", {
        className: `label-url-wrapper item-${label}`,
        parentEl: labelWrapper,
      });

      const urls = labels[label];
      urls.forEach((urlObject) => {
        const labelURLItemWrapper = BookLabel.createDOMElement("div", {
          className: `label-url-item-wrapper item-${label}`,
          parentEl: labelURLWrapper,
        });

        BookLabel.createDOMElement(
          "a",
          {
            className: `label-col-url item-${label}`,
            innerText: `[${urlObject.dir}] - ${urlObject.title}`,
            parentEl: labelURLItemWrapper,
          },
          { href: urlObject.url, target: "_blank" }
        );

        BookLabel.createDOMElement("button", {
          className: `label-col-remove-button item-${label} reset-button`,
          innerText: "x",
          parentEl: labelURLItemWrapper,
          onClick: () => {
            BookLabel.getStorage((result) => {
              const { urls, labels } = result;
              delete urls[urlObject.url];
              updatedLabel = {
                ...labels,
                [label]: labels[label].filter((l) => l.url !== urlObject.url),
              };

              BookLabel.setStorage({ urls, labels: updatedLabel }, () => {
                drawBoard();
                drawCurrentBookmarkLayout();
              });
            });
          },
        });
      });
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
    const wrapper = BookLabel.createDOMElement("div", {
      className: "items-wrapper",
      parentEl: itemList,
    });

    const urlWrapper = BookLabel.createDOMElement("div", {
      className: "url-wrapper",
      parentEl: wrapper,
    });

    const labelWrapper = BookLabel.createDOMElement("div", {
      className: `label-wrapper item-${item.id} hidden`,
      parentEl: wrapper,
    });

    BookLabel.createDOMElement("div", {
      className: `current-label item-${item.id}`,
      parentEl: wrapper,
    });

    const controlWrapper = BookLabel.createDOMElement("div", {
      className: `control-wrapper item-${item.id}`,
      parentEl: wrapper,
    });

    BookLabel.createDOMElement("div", {
      className: `caption-text item-${item.id} visibility`,
      parentEl: controlWrapper,
      innerText: "Click to select/remove the label",
    });

    BookLabel.createDOMElement("button", {
      className: `reset-button add-label-button item-${item.id}`,
      innerText: "+",
      parentEl: controlWrapper,
      onClick: () => {
        toggleCreatingLabel(item.id);
      },
    });

    BookLabel.createDOMElement(
      "img",
      { parentEl: urlWrapper },
      {
        src: `http://www.google.com/s2/favicons?domain=${item.url}`,
      }
    );

    BookLabel.createDOMElement(
      "a",
      {
        parentEl: urlWrapper,
        className: "item-url",
        innerText: item.title,
      },
      { href: item.url, target: "_blank" }
    );

    BookLabel.getStorage((result) => {
      const { labels, urls } = result;
      const currentLabel = urls[item.url];
      drawColorItem(labels, labelWrapper, item, currentLabel);

      if (currentLabel) {
        const currentlabelItem = document.querySelector(
          `.current-label.item-${item.id}`
        );
        drawColorItem({ [currentLabel]: currentLabel }, currentlabelItem);
      }
    });
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
    BookLabel.createDOMElement("div", {
      style: "text-align:center;width:100%",
      innerText: "None of labels",
      parentEl: container,
    });
    return;
  }

  labelNames.forEach((labelName) => {
    const [l, c] = BookLabel.destructuringLabelName(labelName);
    const coloredItem = BookLabel.createDOMElement("div", {
      style: `background-color: ${c}`,
      innerText: l,
      parentEl: container,
    });

    let isSelectedLabel = false;

    if (currentLabel.length) {
      isSelectedLabel = currentLabel.includes(labelName) ? "selected" : "";
    } else {
      isSelectedLabel =
        currentLabel && currentLabel === labelName ? "selected" : "";
    }

    coloredItem.setAttribute("class", `color-item ${isSelectedLabel}`);

    if (onItemClick) {
      coloredItem.onclick = () => {
        onItemClick(labelName);
      };
    } else {
      if (item) {
        // addLabelToURL
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

    BookLabel.createDOMElement("button", {
      className: "reset-button remove-label-button",
      innerText: "x",
      parentEl: coloredItem,
      onClick: () => {
        BookLabel.getStorage((result) => {
          let { labels, boardSelectedLabels, urls } = result;

          labels[labelName] && labels[labelName].forEach(urlObject => {
            delete urls[urlObject.url]
          })
          delete labels[labelName];
          boardSelectedLabels = boardSelectedLabels.filter(
            (l) => l !== labelName
          );
          BookLabel.setStorage(
            {
              labels,
              boardSelectedLabels,
              urls
            },
            () => {
              colorsContainer.textContent = "";
              drawColorItem(labels);
              drawBoard();
              drawCurrentBookmarkLayout();
            }
          );
        });
      },
    });
  });
}

function addLabelToURL(item, labelName) {
  BookLabel.getStorage((result) => {
    let { urls, labels } = result;
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

    BookLabel.setStorage({ urls, labels: updatedLabel }, () => {
      drawCurrentBookmarkLayout();
    });
  });
}

function drawCurrentBookmarkLayout() {
  const { id } = historyDir[historyDir.length - 1] || {};
  drawBookmarkLayout(id);
}
