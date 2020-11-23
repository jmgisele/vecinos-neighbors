// Adapted from here https://stackoverflow.com/questions/3913355/how-to-format-tidy-beautify-in-javascript
export default function formatHTML(html) {
  const tab = '  ';
  let result = '';
  let indent = '';

  html.split(/>\s*</).forEach((element) => {
    if (element.match(/^\/\w/)) indent = indent.substring(tab.length);

    result += `${indent}<${element}>\n`;

    if (element.match(/^<?\w[^>]*[^/]$/)) indent += tab;
  });

  return result.substring(1, result.length - 3);
}
