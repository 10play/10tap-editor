#!/usr/bin/env node
/**
 * Extracts the default web editor HTML shipped in published npm tarballs, so
 * compat tests can run the exact bundles that 1.0.x / 0.7.x users have
 * (including custom bundles built against them) against today's native side.
 *
 *   npm pack @10play/tentap-editor@1.0.1 @10play/tentap-editor@0.7.5-alpha.0
 *   node test/fixtures/legacy/extract.js 10play-tentap-editor-*.tgz
 *
 * Writes editorHtml-<version>.html next to this file and records the tarball
 * integrity (as in the npm registry) in manifest.json.
 */
const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const MODULE = 'package/lib/commonjs/simpleWebEditor/build/editorHtml.js';
const manifestPath = path.join(__dirname, 'manifest.json');

const readMember = (tarball, member) =>
  execFileSync('tar', ['-xzOf', tarball, member], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });

const integrity = (file) =>
  `sha512-${crypto.createHash('sha512').update(fs.readFileSync(file)).digest('base64')}`;

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

const tarballs = process.argv.slice(2);
if (tarballs.length === 0) {
  console.error('usage: extract.js <tentap-editor tarball>...');
  process.exit(1);
}

const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  : {};

for (const tarball of tarballs) {
  const { name, version } = JSON.parse(
    readMember(tarball, 'package/package.json')
  );
  if (name !== '@10play/tentap-editor') {
    throw new Error(`${tarball} is ${name}, not @10play/tentap-editor`);
  }
  const module = { exports: {} };
  vm.runInNewContext(readMember(tarball, MODULE), {
    module,
    exports: module.exports,
  });
  const html = module.exports.editorHtml;
  if (typeof html !== 'string' || !html.includes('<div id="root">')) {
    throw new Error(`${tarball}: ${MODULE} does not export the editor HTML`);
  }
  const file = `editorHtml-${version}.html`;
  fs.writeFileSync(path.join(__dirname, file), html);
  manifest[version] = {
    file,
    tarball: path.basename(tarball),
    integrity: integrity(tarball),
    sha256: sha256(html),
  };
  console.log(`wrote ${file}`);
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
