function fgColor(color, force) {
  // calculate text color based on background
  // adapted from https://awik.io/determine-color-bright-dark-using-javascript/
  if (!color.startsWith('#') || !(color.length === 4 || color.length === 7)) throw new Error('Color has to be a HEX-Color code!');
  if (color.length === 4) color = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`; // eslint-disable-line no-param-reassign

  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));

  if (force === 'light' && hsp < 240) return '#ffffff';
  if (force === 'dark' && hsp > 60) return '#111028';
  if (hsp > 127.5) return '#111028';
  return '#ffffff';
}

export default (initials, color, textColor) => {
  const fg = fgColor(color, textColor);
  const bg = color;
  const weight = '700';
  const fontFamily = '"Inter", sans-serif';
  const size = 128;
  const x = size / 2;
  const y = size / 2;
  const offset = 4;
  const fs = size / 2.5;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');

  c.width = size;
  c.height = size;
  c.style.width = `${size}px`;
  c.style.height = `${size}px`;

  ctx.rect(0, 0, c.width, c.height);
  ctx.fillStyle = bg;
  ctx.fill();

  ctx.font = `${weight} ${fs}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = fg;
  ctx.fillText(initials, x, y + offset);

  return c.toDataURL('image/png');
};
