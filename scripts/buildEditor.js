const fs = require('fs');
const path = require('path');

// This script takes the editor html file and places it into a ts variable
// so that it can be imported without the babel-plugin-inline-import plugin
const htmlPath = process.argv[2];
const htmlDir = path.join(htmlPath, '../');
const editorTsPath = process.argv[3] || path.join(htmlDir, 'editorHtml.ts');

console.log(htmlPath, htmlDir, editorTsPath);

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
    const editorHtml = fs.readFileSync(htmlPath, 'utf8');
    const editorTs = createContent(editorHtml);
    fs.writeFileSync(editorTsPath, editorTs);
    console.log('Built Editor!');
  } catch (error) {
    console.error('Error building editor', error);
  }
};

build();
