export default function rgbToHex(rgb) { // adapted from https://lokeshdhakar.com/projects/color-thief/
  return `#${rgb.map((value) => { const hex = value.toString(16); return hex.length === 1 ? 0 + hex : hex; }).join('')}`;
}
