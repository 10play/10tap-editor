// Caret probe for the caret/ flows on Android debug builds.
//
//   node example/.maestro/caret/caret-probe.mjs --out <dir> [--port 8790] [--metro 8082] (set ANDROID_SERIAL)
//   maestro test -e CARET_PROBE=http://localhost:8790 example/.maestro/caret
//
// Each checkpoint requests /measure?label=..., and the probe compares the caret
// rect of the focused editor (WebView DevTools) with the top of everything
// drawn over the editor: Toolbar, KeyboardSwitcher, CustomKeyboard (measured
// through the app's Hermes inspector on Metro) and the IME window (dumpsys).
// Results are appended to <out>/caret.jsonl; the reply carries `ok`.
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
const PORT = Number(args.port ?? 8790);
const METRO = Number(args.metro ?? 8082);
const OUT = args.out ?? '.';
const APP_ID = args.app ?? 'dev.tenplay.tentapexample';
const WEBVIEW_PORT = Number(args.webviewPort ?? 9333);
// Space the caret should keep from the toolbar: about a line.
const COMFORT_DP = Number(args.comfort ?? 16);
mkdirSync(OUT, { recursive: true });

const adb = (...cmd) =>
  execFileSync('adb', cmd, { encoding: 'utf8', timeout: 15000 });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

const WEB_EXPRESSION = `(() => {
  const pm = document.querySelector('.ProseMirror');
  if (!pm) return null;
  const editor = pm.editor;
  let caret = null;
  if (editor && editor.view) {
    const c = editor.view.coordsAtPos(editor.state.selection.head);
    caret = { top: c.top, bottom: c.bottom };
  } else {
    const sel = getSelection();
    if (sel && sel.rangeCount) {
      const r = sel.getRangeAt(0).getBoundingClientRect();
      caret = { top: r.top, bottom: r.bottom };
    }
  }
  return {
    focused: document.hasFocus() && pm.contains(document.activeElement),
    hasSelection: !!(editor && editor.view && editor.view.hasFocus()),
    caret,
    innerHeight: window.innerHeight,
    dpr: window.devicePixelRatio,
    scrollY: window.scrollY,
    scrollHeight: document.scrollingElement.scrollHeight,
    paddingBottom: getComputedStyle(pm).paddingBottom,
    scrollThreshold: editor && editor.options.editorProps.scrollThreshold,
    blocks: pm.childElementCount,
  };
})()`;

// Walks the React tree for the views drawn over the editor and measures them.
const RN_MEASURE = `(() => {
  const hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  const out = (globalThis.__caretProbe = { pending: 0, views: [] });
  const wanted = (fiber) => {
    const name = fiber.type && (fiber.type.displayName || fiber.type.name);
    if (name === 'Toolbar' || name === 'KeyboardSwitcher') return name;
    const props = fiber.memoizedProps;
    if (props && props.testID === 'tentap-custom-keyboard') return 'CustomKeyboard';
    if (fiber.type === 'RNCWebView') return 'WebView';
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

const metroTarget = async () => {
  const list = await (
    await fetch(`http://localhost:${METRO}/json/list`)
  ).json();
  const targets = list.filter((t) => t.appId === APP_ID);
  return targets[targets.length - 1]?.webSocketDebuggerUrl;
};

const measureNative = async () => {
  const url = await metroTarget();
  if (!url) throw new Error('no Hermes target on Metro');
  await evaluate(url, RN_MEASURE);
  for (let i = 0; i < 20; i++) {
    await sleep(100);
    const result = await evaluate(url, 'globalThis.__caretProbe');
    if (result && result.pending === 0) return result.views;
  }
  throw new Error('measureInWindow did not answer');
};

let forwardedPid;
const webPages = async () => {
  const pid = adb('shell', 'pidof', APP_ID).trim();
  if (pid !== forwardedPid) {
    adb(
      'forward',
      `tcp:${WEBVIEW_PORT}`,
      `localabstract:webview_devtools_remote_${pid}`
    );
    forwardedPid = pid;
  }
  const pages = await (
    await fetch(`http://localhost:${WEBVIEW_PORT}/json`)
  ).json();
  const results = [];
  for (const page of pages.filter((p) => p.type === 'page')) {
    const rect = JSON.parse(page.description || '{}');
    if (rect.attached === false || rect.visible === false) continue;
    const web = await evaluate(page.webSocketDebuggerUrl, WEB_EXPRESSION).catch(
      () => null
    );
    if (web) results.push({ rect, web, url: page.webSocketDebuggerUrl });
  }
  return results;
};

const imeTop = () => {
  const dump = adb('shell', 'dumpsys', 'window', 'InputMethod');
  if (!/isVisible=true/.test(dump)) return null;
  const frame = dump.match(/ frame=\[(\d+),(\d+)\]/);
  const insets = dump.match(/mGivenContentInsets=\[\d+,(\d+)\]/);
  if (!frame || !insets) return null;
  return Number(frame[2]) + Number(insets[1]);
};

const measure = async (label) => {
  const [pages, views, ime] = [
    await webPages(),
    await measureNative(),
    imeTop(),
  ];
  const page =
    pages.find((p) => p.web.focused) ??
    pages.find((p) => p.web.hasSelection) ??
    pages[pages.length - 1];
  if (!page || !page.web.caret)
    return { label, ok: false, error: 'no editor page' };
  const { rect, web } = page;
  const dpr = web.dpr;
  // RN window dp -> screen px: anchor on the RN WebView with the same height.
  const webViews = views.filter((v) => v.label === 'WebView');
  const anchor = webViews.reduce(
    (best, v) =>
      !best ||
      Math.abs(v.height * dpr - rect.height) <
        Math.abs(best.height * dpr - rect.height)
        ? v
        : best,
    undefined
  );
  const windowOffset = anchor ? rect.screenY - anchor.y * dpr : 0;
  const toScreen = (dp) => windowOffset + dp * dpr;
  const covers = views
    .filter((v) => v.label !== 'WebView' && v.height > 0 && v.width > 0)
    .map((v) => ({ label: v.label, top: toScreen(v.y) }));
  if (ime !== null) covers.push({ label: 'IME', top: ime });
  const visibleBottom = Math.min(
    rect.screenY + rect.height,
    ...covers.map((c) => c.top)
  );
  const coveredBy = covers.reduce(
    (a, b) => (!a || b.top < a.top ? b : a),
    undefined
  );
  const caretTop = rect.screenY + web.caret.top * dpr;
  const caretBottom = rect.screenY + web.caret.bottom * dpr;
  const marginDp = (visibleBottom - caretBottom) / dpr;
  const ok = marginDp >= 0 && caretTop >= rect.screenY - 1;
  return {
    label,
    ok,
    comfortable: ok && marginDp >= COMFORT_DP,
    marginDp: Math.round(marginDp * 10) / 10,
    caretScreenPx: {
      top: Math.round(caretTop),
      bottom: Math.round(caretBottom),
    },
    visibleBottomPx: Math.round(visibleBottom),
    nearestCover: coveredBy && {
      label: coveredBy.label,
      top: Math.round(coveredBy.top),
    },
    webView: rect,
    covers: covers.map((c) => ({ ...c, top: Math.round(c.top) })),
    imeTopPx: ime,
    web,
    pages: pages.length,
  };
};

const PASTE_EXPRESSION = `(() => {
  const pm = document.querySelector('.ProseMirror');
  const lines = Array.from({ length: 30 }, (_, i) => 'Pasted paragraph ' + (i + 1));
  const data = new DataTransfer();
  data.setData('text/html', lines.map((line) => '<p>' + line + '</p>').join(''));
  data.setData('text/plain', lines.join('\\n'));
  pm.dispatchEvent(
    new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true })
  );
  return pm.childElementCount;
})()`;

const paste = async (label) => {
  const pages = await webPages();
  const page = pages.find((p) => p.web.focused) ?? pages[pages.length - 1];
  if (!page) return { label, ok: false, error: 'no editor page' };
  const blocks = await evaluate(page.url, PASTE_EXPRESSION);
  return { label, ok: true, blocks };
};

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const label = url.searchParams.get('label') ?? 'unlabelled';
  let result;
  try {
    if (url.pathname === '/paste') {
      result = await paste(label);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(result));
      console.log(
        `PASTE ${label} blocks=${result.blocks ?? '-'} ${result.error ?? ''}`
      );
      return;
    }
    result = await measure(label);
  } catch (error) {
    result = { label, ok: false, error: String(error) };
  }
  result.time = new Date().toISOString();
  try {
    const png = execFileSync('adb', ['exec-out', 'screencap', '-p'], {
      timeout: 15000,
    });
    writeFileSync(join(OUT, `${label.replace(/[^\w.-]+/g, '_')}.png`), png);
  } catch (error) {
    console.log(`screenshot failed: ${error}`);
  }
  appendFileSync(join(OUT, 'caret.jsonl'), JSON.stringify(result) + '\n');
  console.log(
    `${result.ok ? 'OK  ' : 'FAIL'} ${label} margin=${result.marginDp}dp cover=${result.nearestCover?.label ?? '-'} ${result.error ?? ''}`
  );
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify(result));
}).listen(PORT, () => console.log(`caret probe on :${PORT}, writing ${OUT}`));
