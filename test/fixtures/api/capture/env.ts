import fs from 'fs';

const read = (name: string): string => {
  const value = process.env[name];
  if (!value)
    throw new Error(`${name} is not set; run test/fixtures/api/generate.js`);
  return value;
};

/** Checkout being captured. */
export const captureRoot = () => read('TENTAP_CAPTURE_ROOT');

export const writeSnapshot = (snapshot: object) =>
  fs.writeFileSync(
    read('TENTAP_CAPTURE_OUT'),
    `${JSON.stringify(snapshot, null, 2)}\n`
  );
