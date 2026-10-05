#!/usr/bin/env node
/**
 * Checks that every Maestro flow under example/.maestro targets elements
 * that exist: each `id:` must be a testID in the example or library sources,
 * and each text that is tapped or scrolled to (screen names, buttons) must
 * appear in them. Catches flows that break when a screen or testID is renamed.
 * Asserted texts are values the app computes, so they are not checked.
 *
 * Usage: node .github/scripts/check-maestro-flows.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('../..', import.meta.url).pathname;
const flowsDir = join(root, 'example/.maestro');
const sourceDirs = ['example/src', 'example/App.tsx', 'src'];

const walk = (path) =>
  statSync(path).isDirectory()
    ? readdirSync(path)
        .filter((name) => name !== '__tests__' && name !== 'node_modules')
        .flatMap((name) => walk(join(path, name)))
    : [path];

const sources = sourceDirs
  .flatMap((dir) => walk(join(root, dir)))
  .filter((file) => /\.tsx?$/.test(file))
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n');

// testID="x", testID={'x'} and template testIDs such as testID={`sticker-${i}`}.
const testIds = new Set();
const testIdPrefixes = [];
for (const [, literal, template] of sources.matchAll(
  /testID=\{?(?:["']([^"']+)["']|`([^`]+)`)/g
)) {
  if (literal) testIds.add(literal);
  if (template) testIdPrefixes.push(template.split('${')[0]);
}
// Test ids passed through a prop (e.g. <ProbeButton testID="..."/>) are matched above;
// ids forwarded as variables are matched by their literal at the call site.
for (const [, id] of sources.matchAll(/testID:\s*["']([^"']+)["']/g)) {
  testIds.add(id);
}

const hasTestId = (id) =>
  testIds.has(id) ||
  testIdPrefixes.some((prefix) => prefix && id.startsWith(prefix));

const isPattern = (text) => /[.*+?^$()[\]{}|\\]/.test(text);
const unquote = (value) => value.trim().replace(/^(['"])(.*)\1$/, '$2');

const problems = [];
const flows = walk(flowsDir).filter(
  (file) => file.endsWith('.yaml') && !file.endsWith('config.yaml')
);

for (const file of flows) {
  const name = relative(root, file);
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    const at = `${name}:${index + 1}`;
    const id = /^\s*-?\s*id:\s*(.+)$/.exec(line);
    if (id) {
      const value = unquote(id[1]);
      if (!hasTestId(value)) problems.push(`${at}: unknown testID "${value}"`);
      return;
    }
    const text =
      /^\s*-\s*tapOn:\s*(['"].+)$/.exec(line) ??
      /^\s*element:\s*(['"].+)$/.exec(line);
    if (!text) return;
    const value = unquote(text[1]);
    if (!isPattern(value) && !sources.includes(value)) {
      problems.push(`${at}: text "${value}" is not in the sources`);
    }
  });
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`${flows.length} Maestro flows reference existing elements.`);
