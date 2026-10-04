const fs = require('fs');
const path = require('path');

// Wraps the built editor html in a JS module so it can be imported without
// the babel-plugin-inline-import plugin.
// Usage: node buildEditor.js <path/to/index.html> [path/to/output.js]

const createModule = (html) =>
  '// @ts-nocheck\n' +
  '/* eslint-disable */\n' +
  `export const editorHtml = ${JSON.stringify(html)};\n`;

const declaration = 'export declare const editorHtml: string;\n';

const build = () => {
  const htmlPath = process.argv[2];
  if (!htmlPath) {
    throw new Error('Missing path to the built editor html');
  }
  const outputPath =
    process.argv[3] || path.join(path.dirname(htmlPath), 'editorHtml.js');
  const { dir, name } = path.parse(outputPath);
  const declarationPath = path.format({ dir, name, ext: '.d.ts' });

  const html = fs.readFileSync(htmlPath, 'utf8');
  fs.writeFileSync(outputPath, createModule(html));
  fs.writeFileSync(declarationPath, declaration);
  console.log(`Built editor: ${outputPath}`);
};

try {
  build();
} catch (error) {
  console.error('Error building editor:', error.message);
  process.exitCode = 1;
}
