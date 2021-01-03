function formatLabelName(label, color) {
  return `${label}|${color}`;
}

function destructuringLabelName(name) {
  return name.split("|");
}

function createDOMElement(name, options, props = {}) {
  const { className, style, innerText, onClick, parentEl } = options;
  const el = document.createElement(name);

  if (className) el.setAttribute("class", className);
  if (style) el.setAttribute("style", style);
  if (innerText) el.innerText = innerText;
  if (onClick) el.onclick = onClick;
  if (parentEl) {
    parentEl.appendChild(el);
  }

  Object.keys(props).forEach((p) => {
    el[p] = props[p];
  });

  return el;
}

function getStorage(callback) {
  chrome.storage.sync.get(["app"], function (result) {
    const { app } = result;
    callback({ app, ...app });
  });
}

function setStorage(payload = {}) {
  getStorage((app) => {
    chrome.storage.sync.set({
      app: { ...app, ...payload },
    });
  });
}

const BookLabel = {
  formatLabelName,
  destructuringLabelName,
  createDOMElement,
  getStorage,
};

window.BookLabel = BookLabel;
