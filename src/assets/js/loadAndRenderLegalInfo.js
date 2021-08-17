import MarkdownParser from './MarkdownParser';

const md = new MarkdownParser();

export default async function renderLegalInfo() {
  let imprint = '';
  let privacy = '';

  try {
    // The following line doesn’t work since it requires the file to exist (or else the build won’t compile), but using require seems to work
    // const { default: imprint } = await import('raw-loader!../../IMPRINT.md'); // eslint-disable-line import/no-webpack-loader-syntax, import/no-unresolved
    ({ default: imprint } = require('raw-loader!../../../IMPRINT.md')); // eslint-disable-line import/no-webpack-loader-syntax, import/no-unresolved, global-require
    ({ default: privacy } = require('raw-loader!../../../PRIVACY.md')); // eslint-disable-line import/no-webpack-loader-syntax, import/no-unresolved, global-require
  } catch (err) {
    // do nothing, it will fall back to the default message
  }
  return { renderedImprint: md.parse(imprint), renderedPrivacyPolicy: md.parse(privacy) };
}
