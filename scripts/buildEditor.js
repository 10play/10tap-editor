const fs = require('fs');
const path = require('path');

// This script takes the editor html file and places it into a ts variable
// so that it can be imported without the babel-plugin-inline-import plugin
const webDIR = path.resolve(__dirname, '../src/simpleWebEditor');

const createContent = (html) => {
  html = html.replace(/([`$])/g, '\\$1');
  return (
    '/* eslint-disable */\n' +
    'export const editorHtml = String.raw`\n' +
    html +
    "\n`.replace(/\\\\([`$])/g, '\\$1')"
  );
};

const build = async () => {
  try {
    const editorPath = path.join(webDIR, 'build/index.html');
    const editorHtml = fs.readFileSync(editorPath, 'utf8');
    const editorTs = createContent(editorHtml);
    const editorTsPath = path.join(webDIR, 'build/editorHtml.ts');
    fs.writeFileSync(editorTsPath, editorTs);
    console.log('Built Editor!');
  } catch (error) {
    console.error('Error building editor', error);
  }
};

build();
