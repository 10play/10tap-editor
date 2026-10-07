// Caret probe for the caret/ flows on iOS simulator debug builds.
//
//   node example/.maestro/caret/caret-probe-ios.mjs --udid <sim> --out <dir> [--port 8791] [--metro 8081] [--app <id>] [--device <title part>] [--marker false]
//   maestro --device <sim> test -e CARET_PROBE=http://localhost:8791 example/.maestro/caret/basic.yaml
//
// Same protocol as caret-probe.mjs: each checkpoint GETs /measure?label=...,
// /paste pastes 30 paragraphs at the caret and /blur calls editor.blur().
// The caret rect comes from the focused editor (a marker drawn over it
// through the bridge's injectJS), read from the accessibility tree that the
// Maestro driver serves while the flow runs; without it, the paragraph that
// changed since the previous checkpoint (or the one named by &marker=)
// stands in. Its bottom is compared with the top of everything drawn over
// the editor: Toolbar, KeyboardSwitcher and CustomKeyboard (measured through
// the app's Hermes inspector on Metro), the toolbar buttons and the system
// keyboard. A checkpoint also fails when the Toolbar or KeyboardSwitcher
// reaches below the top of the keyboard that is up, or when no keyboard is
// on screen. Results go to <out>/caret.jsonl.
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
// Part of the Metro target title naming the device, when several devices
// run the app on the same Metro.
const DEVICE = args.device ?? '';
// --marker false measures the changed paragraph instead of the caret: adding
// the marker sometimes makes the iOS 26 simulator's WebContent crash.
const USE_MARKER = args.marker !== 'false';
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
    maxBuffer: 64 * 1024 * 1024,
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
    // Expo's Metro only accepts inspector connections from a local origin,
    // while WebView DevTools refuses any origin.
    const local = new URL(url.replace('//localhost:', '//127.0.0.1:'));
    const ws = new WebSocket(local, {
      headers: local.pathname.startsWith('/inspector/')
        ? { origin: `http://${local.host}` }
        : {},
    });
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

const hermesTarget = async () => {
  const list = await (
    await fetch(`http://localhost:${METRO}/json/list`)
  ).json();
  const target = list
    .filter((t) => t.appId === APP_ID && (t.title ?? '').includes(DEVICE))
    .pop();
  if (!target) throw new Error('no Hermes target on Metro');
  return target.webSocketDebuggerUrl;
};

// Calls `call` (e.g. "injectJS(...)") on every mounted editor bridge.
const callOnEditors = async (call) => {
  const expression = `(() => {
    const hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    const editors = new Set();
    const visit = (fiber) => {
      for (let f = fiber; f; f = f.sibling) {
        const editor = f.memoizedProps && f.memoizedProps.editor;
        if (editor && typeof editor.injectJS === 'function') editors.add(editor);
        if (f.child) visit(f.child);
      }
    };
    hook.renderers.forEach((_r, id) =>
      hook.getFiberRoots(id).forEach((root) => visit(root.current))
    );
    editors.forEach((editor) => editor.${call});
    return editors.size;
  })()`;
  return evaluate(await hermesTarget(), expression);
};

// Runs `js` in every mounted editor's WebView.
const injectIntoEditors = (js) =>
  callOnEditors(`injectJS(${JSON.stringify(js)})`);

const CARET_MARKER = 'tentap-caret-probe';

// Draws an invisible element over the focused editor's caret rect, so the
// accessibility tree gives the caret's frame on screen. The element is kept
// and only moved (off screen in an unfocused editor): removing a node the
// accessibility tree was just read from makes WebKit's content process crash.
const SHOW_CARET = `(() => {
  let marker = document.getElementById('${CARET_MARKER}');
  if (!marker) {
    marker = document.createElement('div');
    marker.id = '${CARET_MARKER}';
    marker.setAttribute('role', 'img');
    marker.setAttribute('aria-label', '${CARET_MARKER}');
    document.body.appendChild(marker);
  }
  const pm = document.querySelector('.ProseMirror');
  const editor = pm && pm.editor;
  const focused = editor && editor.view.hasFocus();
  const c = focused
    ? editor.view.coordsAtPos(editor.state.selection.head)
    : { left: 0, top: -1000, bottom: -999 };
  marker.style.cssText = 'position:fixed;pointer-events:none;width:2px;' +
    'background:rgba(0,0,0,0.01);z-index:2147483647;left:' + c.left +
    'px;top:' + c.top + 'px;height:' + Math.max(1, c.bottom - c.top) + 'px';
})(); true;`;

const PASTE = `(() => {
  const pm = document.querySelector('.ProseMirror');
  if (!pm || !pm.editor || !pm.editor.view.hasFocus()) return;
  const lines = Array.from({ length: 30 }, (_, i) => 'Pasted paragraph ' + (i + 1));
  const data = new DataTransfer();
  data.setData('text/html', lines.map((line) => '<p>' + line + '</p>').join(''));
  data.setData('text/plain', lines.join('\\n'));
  pm.dispatchEvent(
    new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true })
  );
})(); true;`;

const measureNative = async () => {
  try {
    const target = await hermesTarget();
    await evaluate(target, RN_MEASURE);
    for (let i = 0; i < 20; i++) {
      await sleep(100);
      const result = await evaluate(target, 'globalThis.__caretProbe');
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
  let injected = false;
  try {
    injected = USE_MARKER && (await injectIntoEditors(SHOW_CARET)) > 0;
  } catch (error) {
    console.warn(`caret marker failed: ${error}`);
  }
  let elements = [];
  let caretMarker;
  for (let i = 0; i < (injected ? 5 : 1); i++) {
    if (injected) await sleep(300);
    elements = flatten(await viewHierarchy());
    caretMarker = elements.find(
      (e) => e.label === CARET_MARKER && e.editor !== undefined && e.top > -500
    );
    if (caretMarker) break;
  }
  // iOS can draw fixed elements off by the keyboard's scroll of the page; a
  // marker outside its own editor is not where the caret is.
  const markerEditor = caretMarker && elements[caretMarker.editor];
  const markerOff =
    !!caretMarker &&
    (caretMarker.top < markerEditor.top - 1 ||
      caretMarker.bottom > markerEditor.bottom + 1);
  if (markerOff) caretMarker = undefined;
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
  const paragraph = pickCaret(texts, marker);
  previousTexts = texts;
  // The caret rect from the editor itself; else the paragraph that changed.
  const caret = caretMarker
    ? { ...caretMarker, label: paragraph?.label ?? CARET_MARKER }
    : paragraph;
  if (!caret) return { label, ok: false, error: 'no editor text' };
  caretText = caret.label;
  const webView = elements[caret.editor];

  const views = await measureNative();
  const covers = views
    .filter((v) => v.height > 0 && v.width > 0)
    .map((v) => ({ label: v.label, top: v.y, bottom: v.y + v.height }));
  const toolbarTop = Math.min(
    ...elements
      .filter((e) => e.type === 9 && TOOLBAR_LABELS.has(e.label))
      .map((e) => e.top)
  );
  if (Number.isFinite(toolbarTop))
    covers.push({ label: 'Toolbar buttons', top: toolbarTop });
  const inputView = elements.find(
    (e) => e.id === 'inputView' && e.bottom > e.top
  );
  // The input view keeps the frame of a taller keyboard it switched from
  // (emoji -> ABC). The keyboard drawn is the topmost full-width plane in the
  // keyboard window that follows it.
  const planeTops = elements
    .slice(elements.indexOf(inputView) + 1)
    .filter(
      (e) =>
        inputView &&
        e.left <= inputView.left &&
        e.right >= inputView.right - 1 &&
        e.bottom >= inputView.bottom - 1 &&
        e.top >= inputView.top
    )
    .map((e) => e.top);
  const keyboard = inputView && {
    top: planeTops.length ? Math.min(...planeTops) : inputView.top,
  };
  if (keyboard) covers.push({ label: 'System keyboard', top: keyboard.top });
  // The native driver draws the custom keyboard as the input view, outside
  // the React tree the Hermes walk measures.
  const customKeyboard = elements.find(
    (e) => e.id === 'tentap-custom-keyboard' && e.bottom > e.top
  );
  if (customKeyboard && !covers.some((c) => c.label === 'CustomKeyboard')) {
    covers.push({
      label: 'CustomKeyboard',
      top: customKeyboard.top,
      bottom: customKeyboard.bottom,
    });
  }
  // The editor's own bottom edge limits it too, e.g. when a parent caps it.
  const limits = [
    { label: 'Editor bottom', top: webView.bottom },
    ...covers.filter((c) => c.top > webView.top),
  ];
  const nearestCover = limits.reduce((a, b) => (b.top < a.top ? b : a));
  // The toolbar must sit fully on screen, on top of the keyboard that is up
  // (the system keyboard or the custom keyboard view).
  const keyboardTop = Math.min(
    ...covers
      .filter((c) => ['System keyboard', 'CustomKeyboard'].includes(c.label))
      .map((c) => c.top)
  );
  const bars = covers.filter((c) =>
    ['Toolbar', 'KeyboardSwitcher'].includes(c.label)
  );
  const toolbarOk = bars.every(
    (c) =>
      c.top >= 0 &&
      (!Number.isFinite(keyboardTop) || c.bottom <= keyboardTop + 1)
  );
  const visibleBottom = nearestCover.top;
  const caretBottom = caret.bottom;
  const caretTop = caretMarker
    ? caret.top
    : Math.max(caret.top, caret.bottom - LINE_PT);
  const margin = visibleBottom - caretBottom;
  // A check without a keyboard on screen proves nothing.
  const keyboardShown = Number.isFinite(keyboardTop);
  // Editors are mounted but none has a caret: the focused one is gone.
  const caretOk =
    (!!caretMarker || !injected || markerOff) &&
    margin >= 0 &&
    caretTop >= webView.top - 1;
  const ok = caretOk && toolbarOk && keyboardShown;
  return {
    label,
    ok,
    caretOk,
    keyboardShown,
    comfortable: ok && margin >= COMFORT_PT,
    caretSource: caretMarker
      ? 'editor'
      : markerOff
        ? 'paragraph (marker off)'
        : 'paragraph',
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
    toolbarOk,
    keyboardTop: Number.isFinite(keyboardTop) ? Math.round(keyboardTop) : null,
    covers: covers.map((c) => ({
      ...c,
      top: Math.round(c.top),
      bottom: c.bottom === undefined ? undefined : Math.round(c.bottom),
    })),
    systemKeyboardTop: keyboard ? Math.round(keyboard.top) : null,
  };
};

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const label = url.searchParams.get('label') ?? 'unlabelled';
  let result;
  try {
    if (url.pathname === '/blur') {
      // What an app's own "done" button does; Maestro's hideKeyboard cannot
      // dismiss the keyboard of a WKWebView.
      result = { label, ok: true, editors: await callOnEditors('blur()') };
      await sleep(800);
    } else if (url.pathname === '/paste') {
      result = { label, ok: true, editors: await injectIntoEditors(PASTE) };
      await sleep(500);
    } else {
      result = await measure(label, url.searchParams.get('marker'));
    }
  } catch (error) {
    result = { label, ok: false, error: String(error) };
  }
  result.time = new Date().toISOString();
  appendFileSync(join(OUT, 'caret.jsonl'), JSON.stringify(result) + '\n');
  console.log(
    `${result.ok ? 'OK  ' : 'FAIL'} ${label} margin=${result.marginDp}pt toolbar=${result.toolbarOk === undefined ? '-' : result.toolbarOk ? 'ok' : 'COVERED'} kb=${result.keyboardShown === false ? 'NONE' : (result.keyboardTop ?? '-')} src=${result.caretSource ?? '-'} cover=${result.nearestCover?.label ?? '-'} caret="${result.caretText ?? ''}" ${result.error ?? ''}`
  );
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify(result));
}).listen(PORT, () =>
  console.log(`iOS caret probe on :${PORT}, writing ${OUT}`)
);
