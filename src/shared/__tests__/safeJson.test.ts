import { jsStringLiteral, safeJSON } from '../safeJson';

const evaluate = (expression: string): unknown =>
  new Function(`"use strict"; return (${expression});`)();

const NASTY = [
  ['single quote', "it's"],
  ['double quote', 'say "hi"'],
  ['backtick', 'a `b` c'],
  ['template placeholder', '${window.pwned = 1}'],
  ['closing script tag', '</script><script>window.pwned = 1</script>'],
  ['uppercase closing script tag', '</SCRIPT >'],
  ['html comment', '<!-- x -->'],
  ['line separator', 'a\u2028b'],
  ['paragraph separator', 'a\u2029b'],
  ['backslash', 'C:\\path\\n'],
  ['newlines and tabs', 'line 1\nline 2\r\n\tline 3'],
  ['ampersand', 'a &amp; b'],
  ['emoji and astral', 'héllo 😀 \ud83d'],
] as const;

describe('jsStringLiteral', () => {
  it.each(NASTY)('round-trips a %s', (_name, value) => {
    const literal = jsStringLiteral(value);
    expect(evaluate(literal)).toBe(value);
  });

  it.each(NASTY)(
    'never emits raw markup or line separators (%s)',
    (_name, value) => {
      const literal = jsStringLiteral(value);
      expect(literal).not.toMatch(/[<>\u2028\u2029\n\r]/);
      expect(literal.startsWith('"')).toBe(true);
      expect(literal.endsWith('"')).toBe(true);
    }
  );
});

describe('safeJSON', () => {
  it('is valid JSON and a valid JS expression with the same value', () => {
    const value = {
      text: NASTY.map(([, nasty]) => nasty).join('|'),
      nested: [{ quote: "'" }, 1, true, null],
    };
    const json = safeJSON(value);
    expect(JSON.parse(json)).toEqual(value);
    expect(evaluate(json)).toEqual(value);
    expect(json).not.toMatch(/[<>&\u2028\u2029]/);
  });

  it('follows JSON.stringify for values JSON cannot represent', () => {
    expect(safeJSON(undefined)).toBe('null');
    expect(safeJSON({ fn: () => 1, keep: 1 })).toBe('{"keep":1}');
    expect(safeJSON([undefined])).toBe('[null]');
  });
});
