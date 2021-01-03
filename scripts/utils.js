function formatLabelName(label, color) {
  return `${label}|${color}`;
}

function destructuringLabelName(name) {
  return name.split("|");
}

function createDOMElement(name, options, props = {}) {
  const { className, style, innerText, onClick, parentEl } = options;
  const el = document.createElement(name);

  el.setAttribute("class", className);
  if (style) el.setAttribute("style", style);
  if (innerText) el.innerText = innerText;
  if (onClick) el.onclick = onClick;
  if (parentEl) {
    parentEl.appendChild(el);
  }

  Object.keys(props).forEach(p => {
    el[p] = props[p];
  })

  return el;
}

const BookLabel = {
  formatLabelName,
  destructuringLabelName,
  createDOMElement,
};

window.BookLabel = BookLabel;
