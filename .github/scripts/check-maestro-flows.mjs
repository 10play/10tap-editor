#!/usr/bin/env node
/**
 * Checks that every Maestro flow under example/.maestro targets elements
 * that exist: each `id:` must be a testID in the example or library sources,
 * and each text that is tapped or scrolled to (screen names, buttons) must
 * appear in them. Catches flows that break when a screen or testID is renamed.
 * Asserted texts are values the app computes, so they are not checked.
 *
 * Parameterized ids such as `id: ${FOCUS_ID}` are resolved through the env
 * variables that carry them: every literal assigned to such a variable (a
 * runFlow `env:` entry like `FOCUS_ID: some-editor`, or a flow default like
 * `${EDITOR_ID || 'some-editor'}`) must be a known testID.
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

// Labels built from a template, such as label: `Heading ${level}`.
const labelPrefixes = Array.from(
  sources.matchAll(/(?:label:\s*|accessibilityLabel=\{)`([^`$]+)\$\{/g),
  ([, prefix]) => prefix
);

const hasText = (text) =>
  sources.includes(text) ||
  labelPrefixes.some((prefix) => text.startsWith(prefix));

const hasTestId = (id) =>
  testIds.has(id) ||
  testIdPrefixes.some((prefix) => prefix && id.startsWith(prefix));

const isPattern = (text) => /[.*+?^$()[\]{}|\\]/.test(text);
const unquote = (value) => value.trim().replace(/^(['"])(.*)\1$/, '$2');

const problems = [];
const flows = walk(flowsDir).filter(
  (file) => file.endsWith('.yaml') && !file.endsWith('config.yaml')
);
const flowLines = flows.map((file) => ({
  name: relative(root, file),
  lines: readFileSync(file, 'utf8').split('\n'),
}));

// `${NAME}` alone, and `${NAME || 'default'}`.
const envRef = /^\$\{\s*([A-Za-z_]\w*)\s*\}$/;
const envDefault = /^\$\{\s*([A-Za-z_]\w*)\s*\|\|\s*(['"])(.*)\2\s*\}$/;
const envEntry = /^\s*([A-Z_][A-Z0-9_]*):\s*(.*)$/;
const idLine = /^\s*-?\s*id:\s*(.+)$/;

// The env variables that end up in an `id:`, followed through assignments
// such as `ID: ${FOCUS_ID}` (FOCUS_ID is passed on as ID).
const idVars = new Set();
for (const { lines } of flowLines) {
  for (const line of lines) {
    const ref = envRef.exec(unquote(idLine.exec(line)?.[1] ?? ''));
    if (ref) idVars.add(ref[1]);
  }
}
for (let grew = true; grew;) {
  grew = false;
  for (const { lines } of flowLines) {
    for (const line of lines) {
      const entry = envEntry.exec(line);
      if (!entry || !idVars.has(entry[1])) continue;
      const value = unquote(entry[2]);
      const from = (envRef.exec(value) ?? envDefault.exec(value))?.[1];
      if (from && !idVars.has(from)) {
        idVars.add(from);
        grew = true;
      }
    }
  }
}

for (const { name, lines } of flowLines) {
  lines.forEach((line, index) => {
    const at = `${name}:${index + 1}`;
    const id = idLine.exec(line);
    if (id) {
      const value = unquote(id[1]);
      // Checked where the variable gets its value (below).
      if (envRef.test(value)) return;
      if (!hasTestId(value)) problems.push(`${at}: unknown testID "${value}"`);
      return;
    }
    const entry = envEntry.exec(line);
    if (entry && idVars.has(entry[1])) {
      const value = unquote(entry[2]);
      const literal = envRef.test(value)
        ? ''
        : (envDefault.exec(value)?.[3] ?? value);
      if (literal.includes('${')) {
        problems.push(`${at}: cannot resolve the testID in "${value}"`);
      } else if (literal && !hasTestId(literal)) {
        problems.push(`${at}: unknown testID "${literal}" (${entry[1]})`);
      }
      return;
    }
    const text =
      /^\s*-\s*tapOn:\s*(['"].+)$/.exec(line) ??
      /^\s*element:\s*(['"].+)$/.exec(line);
    if (!text) return;
    const value = unquote(text[1]);
    if (!isPattern(value) && !hasText(value)) {
      problems.push(`${at}: text "${value}" is not in the sources`);
    }
  });
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`${flows.length} Maestro flows reference existing elements.`);
