// Caret probe for the caret/ flows on iOS simulator debug builds.
//
//   node example/.maestro/caret/caret-probe-ios.mjs --udid <sim> --out <dir> [--port 8791] [--metro 8081]
//   maestro --device <sim> test -e CARET_PROBE=http://localhost:8791 example/.maestro/caret/basic.yaml
//
// Same protocol as caret-probe.mjs: each checkpoint GETs /measure?label=...
// The caret line comes from the accessibility tree that the Maestro driver
// serves while the flow runs: the paragraph that changed since the previous
// checkpoint (or the one named by &marker=). Its bottom is compared with the
// top of everything drawn over the editor: Toolbar, KeyboardSwitcher and
// CustomKeyboard (measured through the app's Hermes inspector on Metro), the
// toolbar buttons and the system keyboard. Results go to <out>/caret.jsonl.
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .reduce(
      (pairs, value, i, all) =>
        i % 2 ? pairs : [...pairs, [all[i].replace(/^--/, ''), all[i + 1]]],
      []
    )
);
const UDID = args.udid;
const PORT = Number(args.port ?? 8791);
const METRO = Number(args.metro ?? 8081);
const OUT = args.out ?? '.';
const APP_ID = args.app ?? 'dev.tenplay.tentapexample';
// Space the caret should keep from the toolbar: about a line.
const COMFORT_PT = Number(args.comfort ?? 16);
const LINE_PT = 24;
const STATIC_TEXT = 48;
const TOOLBAR_LABELS = new Set([
  'Bold',
  'Italic',
  'Link',
  'Task list',
  'Heading',
  'Code',
  'Underline',
  'Undo',
  'Redo',
]);
if (!UDID) throw new Error('--udid is required');
mkdirSync(join(OUT, 'hierarchy'), { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const driverPort = () => {
  const ps = execFileSync('ps', ['-axo', 'pid=,command='], {
    encoding: 'utf8',
  });
  const line = ps
    .split('\n')
    .find(
      (l) => l.includes(UDID) && l.includes('maestro-driver-iosUITests-Runner')
    );
  if (!line) throw new Error('no Maestro driver running for ' + UDID);
  const pid = line.trim().split(/\s+/)[0];
  const lsof = execFileSync(
    'lsof',
    ['-nP', '-a', '-p', pid, '-iTCP', '-sTCP:LISTEN'],
    { encoding: 'utf8' }
  );
  const port = lsof.match(/:(\d+) \(LISTEN\)/);
  if (!port) throw new Error('Maestro driver is not listening');
  return port[1];
};

const viewHierarchy = async () => {
  const response = await fetch(
    `http://127.0.0.1:${driverPort()}/viewHierarchy`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        appIds: [APP_ID],
        excludeKeyboardElements: false,
      }),
    }
  );
  return (await response.json()).axElement;
};

const flatten = (root) => {
  const out = [];
  // `editor` is the index of the enclosing editor web area, if any.
  const visit = (node, editor) => {
    const f = node.frame;
    const index = out.length;
    out.push({
      editor,
      type: node.elementType,
      label: node.label ?? '',
      id: node.identifier ?? '',
      top: f.Y,
      bottom: f.Y + f.Height,
      left: f.X,
      right: f.X + f.Width,
    });
    const inside = node.label === 'RichTextEditor' ? index : editor;
    (node.children ?? []).forEach((child) => visit(child, inside));
  };
  visit(root, undefined);
  return out;
};

const evaluate = (url, expression) =>
  new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error(`timeout ${url}`));
    }, 8000);
    ws.onopen = () =>
      ws.send(
        JSON.stringify({
          id: 1,
          method: 'Runtime.evaluate',
          params: { expression, returnByValue: true },
        })
      );
    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.id !== 1) return;
      clearTimeout(timer);
      ws.close();
      resolve(data.result?.result?.value);
    };
    ws.onerror = (error) => {
      clearTimeout(timer);
      reject(new Error(error.message ?? 'ws error'));
    };
  });

// Walks the React tree for the views drawn over the editor and measures them.
const RN_MEASURE = `(() => {
  const hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  const out = (globalThis.__caretProbe = { pending: 0, views: [] });
  const wanted = (fiber) => {
    const name = fiber.type && (fiber.type.displayName || fiber.type.name);
    if (name === 'Toolbar' || name === 'KeyboardSwitcher') return name;
    const props = fiber.memoizedProps;
    if (props && props.testID === 'tentap-custom-keyboard') return 'CustomKeyboard';
    return null;
  };
  const hostOf = (fiber) => {
    let f = fiber;
    while (f && typeof f.type !== 'string') f = f.child;
    return f;
  };
  const measure = (label, fiber) => {
    const host = hostOf(fiber);
    if (!host || !host.stateNode) return;
    const sn = host.stateNode;
    const node = (sn.canonical && sn.canonical.publicInstance) || sn;
    if (!node.measureInWindow) return;
    out.pending++;
    node.measureInWindow((x, y, width, height) => {
      out.views.push({ label, x, y, width, height });
      out.pending--;
    });
  };
  const visit = (fiber) => {
    for (let f = fiber; f; f = f.sibling) {
      const label = wanted(f);
      if (label) measure(label, f);
      if (f.child) visit(f.child);
    }
  };
  hook.renderers.forEach((_r, id) =>
    hook.getFiberRoots(id).forEach((root) => visit(root.current))
  );
  return out.pending;
})()`;

const measureNative = async () => {
  try {
    const list = await (
      await fetch(`http://localhost:${METRO}/json/list`)
    ).json();
    const target = list.filter((t) => t.appId === APP_ID).pop();
    if (!target) return [];
    await evaluate(target.webSocketDebuggerUrl, RN_MEASURE);
    for (let i = 0; i < 20; i++) {
      await sleep(100);
      const result = await evaluate(
        target.webSocketDebuggerUrl,
        'globalThis.__caretProbe'
      );
      if (result && result.pending === 0) return result.views;
    }
  } catch (error) {
    // Without Metro only the toolbar buttons and the keyboard are measured.
    console.warn(`Hermes measure failed: ${error}`);
  }
  return [];
};

// Paragraph texts of the previous checkpoint and the caret's paragraph.
let previousTexts = [];
let caretText;

const pickCaret = (texts, marker) => {
  if (marker) {
    const match = texts.filter((t) => t.label.includes(marker)).pop();
    if (match) return match;
  }
  const seen = new Map();
  previousTexts.forEach((t) => seen.set(t.label, (seen.get(t.label) ?? 0) + 1));
  const changed = texts.filter((t) => {
    const count = seen.get(t.label) ?? 0;
    if (count > 0) seen.set(t.label, count - 1);
    return count === 0;
  });
  if (changed.length) return changed[changed.length - 1];
  return texts.find((t) => t.label === caretText) ?? texts[texts.length - 1];
};

const measure = async (label, marker) => {
  const elements = flatten(await viewHierarchy());
  writeFileSync(
    join(OUT, 'hierarchy', `${label}.json`),
    JSON.stringify(elements)
  );
  // Every paragraph shows up twice; keep one of each, in document order.
  const texts = elements
    .filter((e) => e.type === STATIC_TEXT && e.label.trim())
    .filter((e) => e.editor !== undefined)
    .filter(
      (e, i, all) =>
        !all.slice(0, i).some((p) => p.label === e.label && p.top === e.top)
    );
  if (/-00-/.test(label)) previousTexts = [];
  const caret = pickCaret(texts, marker);
  previousTexts = texts;
  if (!caret) return { label, ok: false, error: 'no editor text' };
  caretText = caret.label;
  const webView = elements[caret.editor];

  const views = await measureNative();
  const covers = views
    .filter((v) => v.height > 0 && v.width > 0)
    .map((v) => ({ label: v.label, top: v.y }));
  const toolbarTop = Math.min(
    ...elements
      .filter((e) => e.type === 9 && TOOLBAR_LABELS.has(e.label))
      .map((e) => e.top)
  );
  if (Number.isFinite(toolbarTop))
    covers.push({ label: 'Toolbar buttons', top: toolbarTop });
  const keyboard = elements.find(
    (e) => e.id === 'inputView' && e.bottom > e.top
  );
  if (keyboard) covers.push({ label: 'System keyboard', top: keyboard.top });
  // The editor's own bottom edge limits it too, e.g. when a parent caps it.
  const limits = [
    { label: 'Editor bottom', top: webView.bottom },
    ...covers.filter((c) => c.top > webView.top),
  ];
  const nearestCover = limits.reduce((a, b) => (b.top < a.top ? b : a));
  const visibleBottom = nearestCover.top;
  const caretBottom = caret.bottom;
  const caretTop = Math.max(caret.top, caret.bottom - LINE_PT);
  const margin = visibleBottom - caretBottom;
  const ok = margin >= 0 && caretTop >= webView.top - 1;
  return {
    label,
    ok,
    comfortable: ok && margin >= COMFORT_PT,
    marginDp: Math.round(margin * 10) / 10,
    caretText: caret.label.slice(-60),
    caretPt: {
      top: Math.round(caretTop),
      bottom: Math.round(caretBottom),
      paragraphTop: Math.round(caret.top),
    },
    visibleBottomPt: Math.round(visibleBottom),
    nearestCover: {
      label: nearestCover.label,
      top: Math.round(nearestCover.top),
    },
    webView: {
      top: Math.round(webView.top),
      bottom: Math.round(webView.bottom),
    },
    covers: covers.map((c) => ({ ...c, top: Math.round(c.top) })),
    systemKeyboardTop: keyboard ? Math.round(keyboard.top) : null,
  };
};

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const label = url.searchParams.get('label') ?? 'unlabelled';
  let result;
  try {
    result = await measure(label, url.searchParams.get('marker'));
  } catch (error) {
    result = { label, ok: false, error: String(error) };
  }
  result.time = new Date().toISOString();
  appendFileSync(join(OUT, 'caret.jsonl'), JSON.stringify(result) + '\n');
  console.log(
    `${result.ok ? 'OK  ' : 'FAIL'} ${label} margin=${result.marginDp}pt cover=${result.nearestCover?.label ?? '-'} caret="${result.caretText ?? ''}" ${result.error ?? ''}`
  );
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify(result));
}).listen(PORT, () =>
  console.log(`iOS caret probe on :${PORT}, writing ${OUT}`)
);
