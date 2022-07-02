export default class PmImageView {
  constructor(node, view, getPos, allowCaption) { // eslint-disable-line no-unused-vars
    const figure = document.createElement('figure');
    const img = document.createElement('img');

    Object.entries(node.attrs).forEach(([name, value]) => {
      // TODO: replace src with the objectUrl for the loaded image
      if (name === 'data' && value) {
        Object.entries(value).forEach(([dataName, dataValue]) => {
          // data-attributes in HTML must be all lowercase
          // accessing them via el.dataset returns them as camelCased though, so we convert them back here
          const cleanKey = dataName.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
          img.setAttribute(`data-${cleanKey}`, String(dataValue));
        });
      } else if (value) img.setAttribute(name, value);
    });

    img.setAttribute('draggable', 'false');

    figure.appendChild(img);

    if (allowCaption) {
      const caption = document.createElement('figcaption');
      if (node.content.size === 0) caption.classList.add('empty');
      figure.appendChild(caption);
      this.contentDOM = caption;
    }

    this.dom = figure;
    this.allowCaption = allowCaption;
  }

  update(node) {
    if (node.type.name !== 'image') return false;

    if (this.allowCaption) {
      const caption = this.dom.querySelector('figcaption');

      if (node.content.size > 0) caption.classList.remove('empty');
      else caption.classList.add('empty');
    }

    return true;
  }
}
