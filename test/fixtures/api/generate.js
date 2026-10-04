#!/usr/bin/env node
/**
 * Regenerates the public API snapshots in this directory from released
 * commits. The snapshots are the baseline of the 1.x compatibility gate:
 * regenerate them to fix the capture or after a dependency upgrade, never to
 * accept a removal.
 *
 *   node test/fixtures/api/generate.js
 *
 * Each commit is checked out into a temporary git worktree (under
 * $TENTAP_TMPDIR, default os.tmpdir()) that borrows this checkout's
 * node_modules, then captured with the repo's own jest (native entry) and
 * vitest (web entry) setups.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const repo = path.resolve(__dirname, '../../..');
const captureDir = path.join(__dirname, 'capture');
const mocks = path.join(repo, 'src/__mocks__');

const TARGETS = [
  {
    // v1.0.1
    commit: '562f738',
    version: '1.0.1',
    captures: [
      {
        entry: '.',
        runner: 'jest',
        test: 'root.capture.test.ts',
        out: 'v1.0.1-root.json',
      },
      {
        entry: './web',
        runner: 'vitest',
        test: 'web.capture.vitest.ts',
        out: 'v1.0.1-web.json',
      },
    ],
  },
  {
    // Parent of 9e4d40b ("refactor: remove keyboard"), i.e. v0.7.4 plus docs.
    commit: '9e4d40b^',
    version: '0.7.4',
    captures: [
      {
        entry: '.',
        runner: 'jest',
        test: 'keyboard.capture.test.ts',
        out: 'v0.7.4-keyboard.json',
      },
    ],
  },
];

const run = (command, args, env = {}) =>
  execFileSync(command, args, {
    cwd: repo,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });

const git = (...args) =>
  execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();

const jestConfig = (worktree) => {
  const base = require(path.join(repo, 'jest.config.js'));
  return {
    ...base,
    rootDir: repo,
    roots: [captureDir],
    testMatch: ['**/*.capture.test.ts'],
    setupFilesAfterEnv: [],
    modulePathIgnorePatterns: [],
    moduleNameMapper: {
      '^react-native-webview$': path.join(mocks, 'react-native-webview.tsx'),
      '(^|/)simpleWebEditor/build/editorHtml$': path.join(
        mocks,
        'editorHtml.ts'
      ),
      '(^|/)webEditorUtils/focusListener$': path.join(
        captureDir,
        'focusListener.ts'
      ),
      '^@10play/tentap-editor$': path.join(captureDir, 'tentapStub.ts'),
    },
    // Old sources import packages relative to the worktree.
    modulePaths: [path.join(worktree, 'node_modules')],
  };
};

/** The package.json fields that decide how '.' and './web' resolve. */
const entryPoints = (worktree) => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(worktree, 'package.json'), 'utf8')
  );
  const fields = [
    'main',
    'module',
    'types',
    'react-native',
    'source',
    'exports',
  ];
  return Object.fromEntries(
    fields
      .filter((field) => field in manifest)
      .map((field) => [field, manifest[field]])
  );
};

const writeVitestConfig = (dir) => {
  const file = path.join(dir, 'vitest.capture.config.mjs');
  fs.writeFileSync(
    file,
    `export default { test: { environment: 'jsdom', root: ${JSON.stringify(repo)}, ` +
      `include: [${JSON.stringify(path.join(captureDir, '*.capture.vitest.ts'))}] } };\n`
  );
  return file;
};

const capture = (target, worktree, tmp, { entry, runner, test, out }) => {
  const raw = path.join(tmp, `${out}.raw`);
  const env = { TENTAP_CAPTURE_ROOT: worktree, TENTAP_CAPTURE_OUT: raw };
  if (runner === 'jest') {
    run(
      'yarn',
      [
        'jest',
        '--config',
        JSON.stringify(jestConfig(worktree)),
        '--runTestsByPath',
        path.join(captureDir, test),
      ],
      env
    );
  } else {
    run('yarn', ['vitest', 'run', '--config', writeVitestConfig(tmp)], env);
  }
  const snapshot = {
    package: '@10play/tentap-editor',
    version: target.version,
    commit: git('rev-parse', '--short', target.commit),
    entry,
    ...(entry === '.' ? { manifest: entryPoints(worktree) } : {}),
    ...JSON.parse(fs.readFileSync(raw, 'utf8')),
  };
  fs.writeFileSync(
    path.join(__dirname, out),
    `${JSON.stringify(snapshot, null, 2)}\n`
  );
  console.log(`wrote ${out}`);
};

const tmp = fs.mkdtempSync(
  path.join(process.env.TENTAP_TMPDIR || os.tmpdir(), 'tentap-api-')
);
try {
  for (const target of TARGETS) {
    const worktree = path.join(tmp, target.version);
    git('worktree', 'add', '--detach', worktree, target.commit);
    try {
      fs.symlinkSync(
        path.join(repo, 'node_modules'),
        path.join(worktree, 'node_modules'),
        'dir'
      );
      // Stand-in for the generated HTML so TypeScript resolves the export.
      const build = path.join(worktree, 'src/simpleWebEditor/build');
      fs.mkdirSync(build, { recursive: true });
      fs.writeFileSync(
        path.join(build, 'editorHtml.ts'),
        "export const editorHtml: string = '';\n"
      );
      for (const item of target.captures) capture(target, worktree, tmp, item);
    } finally {
      git('worktree', 'remove', '--force', worktree);
    }
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
