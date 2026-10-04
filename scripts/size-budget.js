const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Fails when a built web bundle is more than `maxGrowth` over its recorded
// baseline. Run after `yarn editor:build`.
// Usage: node scripts/size-budget.js [path/to/size-budget.json]

const root = path.resolve(__dirname, '..');
const budgetPath = process.argv[2] || path.join(__dirname, 'size-budget.json');

const formatKB = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

const check = () => {
  const { maxGrowth, bundles } = JSON.parse(
    fs.readFileSync(budgetPath, 'utf8')
  );
  let failed = false;
  for (const [name, { file, bytes: baseline }] of Object.entries(bundles)) {
    const filePath = path.join(root, file);
    if (!fs.existsSync(filePath)) {
      console.error(`${name}: ${file} not found; build it first`);
      failed = true;
      continue;
    }
    const content = fs.readFileSync(filePath);
    const limit = Math.floor(baseline * (1 + maxGrowth));
    const growth = ((content.length / baseline - 1) * 100).toFixed(2);
    const over = content.length > limit;
    console.log(
      `${over ? 'FAIL' : 'ok  '} ${name}: ${formatKB(content.length)} ` +
        `(gzip ${formatKB(zlib.gzipSync(content).length)}), ` +
        `${growth}% vs baseline ${formatKB(baseline)}, limit ${formatKB(limit)}`
    );
    failed = failed || over;
  }
  return !failed;
};

try {
  if (!check()) process.exitCode = 1;
} catch (error) {
  console.error('Error checking bundle sizes:', error.message);
  process.exitCode = 1;
}
