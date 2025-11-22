const fs = require('fs');
const path = require('path');

// This script takes the editor html file and places it into a ts variable
// so that it can be imported without the babel-plugin-inline-import plugin
const htmlPath = process.argv[2];
const htmlDir = path.join(htmlPath, '../');
const editorTsPath = process.argv[3] || path.join(htmlDir, 'editorHtml.js');

const createContent = (html) => {
  return (
    '// @ts-nocheck\n' +
    '/* eslint-disable */\n' +
    `export const editorHtml = ${JSON.stringify(html)};\n`
  );
};

const build = async () => {
  try {
    const editorHtml = fs.readFileSync(htmlPath, 'utf8');
    const editorTs = createContent(editorHtml);
    fs.writeFileSync(editorTsPath, editorTs);

    // Create type declaration file
    const dtsPath = editorTsPath.replace('.js', '.d.ts');
    fs.writeFileSync(dtsPath, 'export declare const editorHtml: string;\n');

    console.log('Built Editor!');
  } catch (error) {
    console.error('Error building editor', error);
  }
};

build();
