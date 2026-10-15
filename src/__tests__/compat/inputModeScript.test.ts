import fs from 'fs';
import path from 'path';
import {
  INPUT_MODE_RESTORE_SCRIPT,
  INPUT_MODE_SUPPRESS_SCRIPT,
} from '../../RichText/Keyboard/webSnippets';

/**
 * The Android module evaluates `InputModeScript` natively while the fallback
 * driver injects the TypeScript twin; both must toggle the editor the same
 * way, so the strings have to stay identical.
 */

const javaSource = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../android/src/main/java/com/tentap/InputModeScript.java'
  ),
  'utf8'
);

/** The value of a `static final String` built from concatenated literals. */
const javaStringConstant = (name: string): string => {
  const declaration = new RegExp(
    `static\\s+final\\s+String\\s+${name}\\s*=`
  ).exec(javaSource);
  if (!declaration) throw new Error(`InputModeScript.${name} not found`);
  // Literals up to the `;` that ends the statement (outside any literal).
  const statement = /^(?:\s*(?:\+\s*)?"(?:[^"\\]|\\.)*")+\s*;/.exec(
    javaSource.slice(declaration.index + declaration[0].length)
  );
  if (!statement) throw new Error(`InputModeScript.${name} is not a literal`);
  return (statement[0].match(/"(?:[^"\\]|\\.)*"/g) ?? [])
    .map((literal) => JSON.parse(literal) as string)
    .join('');
};

describe('InputModeScript (Java) and webSnippets (TypeScript)', () => {
  it('suppress the IME with the same script', () => {
    expect(javaStringConstant('SUPPRESS')).toBe(INPUT_MODE_SUPPRESS_SCRIPT);
  });

  it('restore the IME with the same script', () => {
    expect(javaStringConstant('RESTORE')).toBe(INPUT_MODE_RESTORE_SCRIPT);
  });
});
