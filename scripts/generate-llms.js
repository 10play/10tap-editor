#!/usr/bin/env node
/**
 * Generates the llms.txt files (https://llmstxt.org) of the docs website:
 *
 * - website/static/llms.txt: a summary and a link, with a one-line
 *   description, to every page in the docs sidebar.
 * - website/static/llms-full.txt: every page as plain markdown, in sidebar
 *   order, without frontmatter, MDX imports or JSX.
 *
 * Page descriptions come from the `description` frontmatter field, or else
 * from the first sentence of the page. Links point at the deployed site
 * (`url` + `baseUrl` in website/docusaurus.config.ts).
 *
 * Usage: node scripts/generate-llms.js [--check]
 *   --check  exit 1 if the committed files are out of date instead of writing.
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const website = path.join(root, 'website');
const docsDir = path.join(website, 'docs');
const outDir = path.join(website, 'static');

const SUMMARY =
  'Rich text editor for React Native, built on TipTap and ProseMirror running in a WebView. ' +
  'Typed, works out of the box with a toolbar, and is extended through bridge extensions.';

const KEY_FACTS = [
  'npm package: `@10play/tentap-editor`; install it with `react-native-webview`.',
  'Runs on iOS and Android (new and old architecture) and in Expo; Expo web is in beta.',
  'Core API: `useEditorBridge` creates the editor, `RichText` renders it, `Toolbar` formats it, `EditorKeyboardAvoidingView` keeps the toolbar above the keyboard.',
  'Content is read asynchronously (`await editor.getHTML()`, `getJSON()`, `getText()`) or with `useEditorContent`; `onChange` does not pass the content.',
  'UI state such as `isBoldActive` comes from `useBridgeState(editor)`.',
  'Formatting commands come from bridge extensions; `TenTapStartKit` includes all of them.',
  '1.1 is backwards compatible with 1.0: no code changes are needed to upgrade.',
];

const OPTIONAL_LINKS = [
  [
    'GitHub repository',
    'https://github.com/10play/10tap-editor',
    'source code, example apps and issues',
  ],
  [
    'Changelog',
    'https://github.com/10play/10tap-editor/blob/main/CHANGELOG.md',
    'release notes',
  ],
  ['1.0 docs', 'docs/1.0/intro', 'documentation of the previous version'],
];

/** Evaluates website/sidebars.ts, which only has type imports. */
const loadSidebars = () => {
  const source = fs.readFileSync(path.join(website, 'sidebars.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  const module = { exports: {} };
  new Function('module', 'exports', 'require', outputText)(
    module,
    module.exports,
    require
  );
  return module.exports.default;
};

/** Reads a string property of the docusaurus config, e.g. `url: '...'`. */
const readConfigString = (config, key) => {
  const match = config.match(
    new RegExp(`^\\s*${key}:\\s*['"]([^'"]+)['"]`, 'm')
  );
  if (!match) throw new Error(`docusaurus.config.ts has no ${key}`);
  return match[1];
};

const loadSiteUrl = () => {
  const config = fs.readFileSync(
    path.join(website, 'docusaurus.config.ts'),
    'utf8'
  );
  const url = readConfigString(config, 'url').replace(/\/$/, '');
  const baseUrl = readConfigString(config, 'baseUrl');
  return `${url}${baseUrl}`;
};

const parseFrontmatter = (source) => {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return { data: {}, body: source };
  const data = {};
  for (const line of match[1].split('\n')) {
    const field = line.match(/^(\w+):\s*(.*)$/);
    if (!field) continue;
    let value = field[2].trim();
    if (/^".*"$/.test(value)) value = JSON.parse(value);
    else if (/^'.*'$/.test(value))
      value = value.slice(1, -1).replace(/''/g, "'");
    data[field[1]] = value;
  }
  return { data, body: source.slice(match[0].length) };
};

/** Splits a line into text and inline code spans, transforming only text. */
const mapOutsideCode = (line, transform) =>
  line
    .split(/(`+[^`]*`+)/)
    .map((part, i) => (i % 2 ? part : transform(part)))
    .join('');

const plainText = (markdown) =>
  markdown
    .replace(/<[^>]+>/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** The first sentence of the page's first prose paragraph. */
const firstSentence = (body) => {
  let inFence = false;
  for (const line of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence || !line.trim() || /^\s*[#<:>|-]|^(import|export) /.test(line))
      continue;
    const text = plainText(line);
    if (text) return text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text;
  }
  return '';
};

const collectSections = (sidebar) => {
  const sections = [];
  const visit = (items, section) => {
    for (const item of items) {
      if (typeof item === 'string') {
        section.docs.push({ id: item });
      } else if (item.type === 'doc') {
        section.docs.push({ id: item.id, label: item.label });
      } else if (item.type === 'category') {
        const child = { label: item.label, docs: [] };
        sections.push(child);
        visit(item.items, child);
      }
    }
  };
  const topLevel = { label: 'Docs', docs: [] };
  sections.push(topLevel);
  visit(sidebar, topLevel);
  return sections.filter((section) => section.docs.length > 0);
};

const loadDoc = (id, siteUrl) => {
  const file = ['.md', '.mdx']
    .map((ext) => path.join(docsDir, id + ext))
    .find((candidate) => fs.existsSync(candidate));
  if (!file) throw new Error(`No file for doc "${id}" in website/docs`);
  const { data, body } = parseFrontmatter(fs.readFileSync(file, 'utf8'));
  const heading = body.match(/^#\s+(.+)$/m)?.[1].trim();
  const title = data.title ?? heading ?? id;
  return {
    id,
    file,
    title,
    description: data.description ?? firstSentence(body),
    url: `${siteUrl}docs/${(data.slug ?? id).replace(/^\//, '')}`,
    body,
  };
};

/** Absolute URL for a link or image target found in `doc`. */
const resolveHref = (href, doc, docsById, siteUrl) => {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return href;
  if (href.startsWith('#')) return doc.url + href;
  const basePath = new URL(siteUrl).pathname;
  if (href.startsWith(basePath)) return new URL(siteUrl).origin + href;
  if (href.startsWith('/')) return siteUrl + href.slice(1);
  const [target, anchor = ''] = href.split(/(?=#)/);
  if (!/\.mdx?$/.test(target)) return href;
  const id = path
    .relative(docsDir, path.resolve(path.dirname(doc.file), target))
    .replace(/\.mdx?$/, '')
    .split(path.sep)
    .join('/');
  const linked = docsById.get(id);
  return (linked ? linked.url : `${siteUrl}docs/${id}`) + anchor;
};

const ADMONITION = /^:::(\w+)(?:\s+(.*))?$/;

/** Turns a page body into plain markdown. */
const cleanBody = (doc, docsById, siteUrl) => {
  const out = [];
  let fence = null;
  let quote = false;
  for (const raw of doc.body.split('\n')) {
    const prefix = quote ? '> ' : '';
    const fenceMatch = raw.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      out.push(raw.trim() ? prefix + raw : prefix.trimEnd());
      if (
        fenceMatch &&
        fenceMatch[1][0] === fence[0] &&
        fenceMatch[1].length >= fence.length
      )
        fence = null;
      continue;
    }
    if (fenceMatch) {
      fence = fenceMatch[1];
      out.push(prefix + raw);
      continue;
    }
    // MDX imports and exports.
    if (/^(import|export)\s/.test(raw)) continue;
    // Admonitions become blockquotes.
    const admonition = raw.trim().match(ADMONITION);
    if (admonition) {
      const kind = admonition[1][0].toUpperCase() + admonition[1].slice(1);
      quote = true;
      out.push(`> **${admonition[2] ? `${kind}: ${admonition[2]}` : kind}**`);
      continue;
    }
    if (quote && raw.trim() === ':::') {
      quote = false;
      continue;
    }
    // Tabs keep their label as a bold line.
    const tab = raw.match(/^\s*<TabItem\b[^>]*\blabel="([^"]+)"/);
    if (tab) {
      out.push(`${prefix}**${tab[1]}**`, prefix.trimEnd());
      continue;
    }
    const line = mapOutsideCode(raw, (text) =>
      text
        .replace(/<img\b[^>]*>/gi, '')
        .replace(
          /<a\b[^>]*\bhref="([^"]+)"[^>]*>([^<]*)<\/a>/gi,
          (_, href, label) => (label.trim() ? `[${label.trim()}](${href})` : '')
        )
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?[A-Za-z][\w.]*(?:\s[^>]*)?\/?>/g, '')
        .replace(
          /(!?\[[^\]]*\])\(([^)\s]+)\)/g,
          (_, label, href) =>
            `${label}(${resolveHref(href, doc, docsById, siteUrl)})`
        )
    );
    if (line === raw) {
      out.push(raw.trim() ? prefix + raw : prefix.trimEnd());
      continue;
    }
    // A changed line keeps its indent; lines that only held tags are dropped.
    const indent = raw.match(/^\s*/)[0];
    for (const part of line.split('\n')) {
      if (part.trim()) out.push(prefix + indent + part.trim());
    }
  }
  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const generate = () => {
  const siteUrl = loadSiteUrl();
  const sidebars = loadSidebars();
  const sidebar = sidebars.tutorialSidebar ?? Object.values(sidebars)[0];
  const sections = collectSections(sidebar).map((section) => ({
    label: section.label,
    docs: section.docs.map((entry) => ({
      ...loadDoc(entry.id, siteUrl),
      label: entry.label,
    })),
  }));
  const docs = sections.flatMap((section) => section.docs);
  const docsById = new Map(docs.map((doc) => [doc.id, doc]));

  const index = [
    '# 10tap-editor',
    '',
    `> ${SUMMARY}`,
    '',
    ...KEY_FACTS.map((fact) => `- ${fact}`),
    '',
    `The full text of every page below is in [llms-full.txt](${siteUrl}llms-full.txt).`,
  ];
  for (const section of sections) {
    index.push('', `## ${section.label}`, '');
    for (const doc of section.docs) {
      const description = doc.description ? `: ${doc.description}` : '';
      index.push(`- [${doc.title}](${doc.url})${description}`);
    }
  }
  index.push('', '## Optional', '');
  for (const [title, href, description] of OPTIONAL_LINKS) {
    const url = /^https?:/.test(href) ? href : siteUrl + href;
    index.push(`- [${title}](${url}): ${description}`);
  }

  const full = [
    '# 10tap-editor documentation',
    '',
    `> ${SUMMARY}`,
    '',
    `Every page of ${siteUrl}docs/intro, in sidebar order. Each page starts with its URL.`,
  ];
  for (const doc of docs) {
    full.push(
      '',
      '---',
      '',
      `Source: ${doc.url}`,
      '',
      cleanBody(doc, docsById, siteUrl)
    );
  }

  return {
    'llms.txt': index.join('\n') + '\n',
    'llms-full.txt': full.join('\n') + '\n',
  };
};

const main = () => {
  const check = process.argv.includes('--check');
  const files = generate();
  const stale = [];
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(outDir, name);
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (current === content) continue;
    if (check) stale.push(path.relative(root, file));
    else fs.writeFileSync(file, content);
  }
  if (stale.length > 0) {
    console.error(
      `${stale.join(' and ')} ${stale.length > 1 ? 'are' : 'is'} out of date. ` +
        'Run `yarn docs:llms` and commit the result.'
    );
    process.exit(1);
  }
};

if (require.main === module) main();

module.exports = { generate, cleanBody, firstSentence, parseFrontmatter };
