#!/usr/bin/env node
/**
 * Bundles the packed library with Metro, the way a React Native app would, and
 * fails if anything in the native bundle requires react-dom.
 *
 * The library is packed with npm (running prepack and prepare), extracted into a temporary project
 * outside the repo, and bundled with the repo's react-native and dependencies.
 *
 * Usage: node scripts/check-isolated-bundle.js [--tarball <file>] [--platform ios|android] [--keep]
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const FORBIDDEN = /^react-dom(\/|$)/;

const parseArgs = (argv) => {
  const args = { tarball: undefined, platform: 'ios', keep: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--keep') {
      args.keep = true;
    } else if (arg === '--tarball' && argv[i + 1]) {
      args.tarball = path.resolve(argv[++i]);
    } else if (
      arg === '--platform' &&
      ['ios', 'android'].includes(argv[i + 1])
    ) {
      args.platform = argv[++i];
    } else {
      throw new Error(`Unknown or incomplete argument: ${arg}`);
    }
  }
  return args;
};

const pack = (workDir) => {
  console.log('Packing the library (runs prepack and prepare)...');
  // `yarn pack` skips `prepare`, which builds lib/.
  execFileSync('npm', ['pack', '--pack-destination', workDir], {
    cwd: root,
    stdio: 'inherit',
  });
  const tarball = fs.readdirSync(workDir).find((file) => file.endsWith('.tgz'));
  if (!tarball) throw new Error('npm pack wrote no tarball');
  return path.join(workDir, tarball);
};

const createProject = (workDir, tarball) => {
  const projectDir = path.join(workDir, 'app');
  const packageDir = path.join(
    projectDir,
    'node_modules/@10play/tentap-editor'
  );
  fs.mkdirSync(packageDir, { recursive: true });
  execFileSync('tar', [
    '-xzf',
    tarball,
    '-C',
    packageDir,
    '--strip-components=1',
  ]);

  fs.writeFileSync(
    path.join(projectDir, 'package.json'),
    JSON.stringify({ name: 'tentap-isolated-bundle', private: true })
  );
  fs.writeFileSync(
    path.join(projectDir, 'babel.config.js'),
    `module.exports = { presets: [${JSON.stringify(
      require.resolve('@react-native/babel-preset', { paths: [root] })
    )}] };\n`
  );
  fs.writeFileSync(
    path.join(projectDir, 'index.js'),
    "import * as TenTap from '@10play/tentap-editor';\n" +
      'globalThis.__tentapExports = Object.keys(TenTap);\n'
  );
  return projectDir;
};

const bundle = async (projectDir, platform) => {
  const Metro = require('metro');
  const {
    getDefaultConfig,
    mergeConfig,
  } = require('@react-native/metro-config');
  const offenders = [];

  const config = mergeConfig(getDefaultConfig(projectDir), {
    projectRoot: projectDir,
    watchFolders: [projectDir, path.join(root, 'node_modules')],
    cacheStores: [],
    resolver: {
      nodeModulesPaths: [
        path.join(projectDir, 'node_modules'),
        path.join(root, 'node_modules'),
      ],
      resolveRequest: (context, moduleName, requestPlatform) => {
        if (FORBIDDEN.test(moduleName)) {
          offenders.push({ moduleName, from: context.originModulePath });
          return { type: 'empty' };
        }
        return context.resolveRequest(context, moduleName, requestPlatform);
      },
    },
  });

  const out = path.join(projectDir, `index.${platform}.bundle.js`);
  await Metro.runBuild(config, {
    entry: 'index.js',
    platform,
    dev: false,
    minify: false,
    out,
  });
  return { offenders, out };
};

const relative = (file) => {
  const marker = `${path.sep}node_modules${path.sep}`;
  const index = file.lastIndexOf(marker);
  return index === -1 ? file : file.slice(index + marker.length);
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  // Metro needs real paths (macOS tmpdir is a symlink).
  const workDir = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'tentap-bundle-'))
  );
  try {
    const tarball = args.tarball ?? pack(workDir);
    const projectDir = createProject(workDir, tarball);
    const { offenders, out } = await bundle(projectDir, args.platform);

    if (offenders.length > 0) {
      console.error(
        `\nreact-dom is reachable from the ${args.platform} bundle:`
      );
      for (const { moduleName, from } of offenders) {
        console.error(`  - ${relative(from)} requires ${moduleName}`);
      }
      process.exitCode = 1;
      return;
    }
    const size = (fs.statSync(out).size / 1024).toFixed(0);
    console.log(
      `\nIsolated ${args.platform} bundle OK (${size} KB), no react-dom.`
    );
  } finally {
    if (args.keep) {
      console.log(`Kept ${workDir}`);
    } else {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  }
};

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
