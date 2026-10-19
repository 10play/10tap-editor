const UNSAFE_CHARACTERS = /[<>&\u2028\u2029]/g;

const ESCAPES: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

/**
 * Serialises `value` to JSON that is also safe to embed verbatim as a JS
 * expression, including inside an inline `<script>` element: `<`, `>`, `&`,
 * U+2028 and U+2029 are emitted as `\uXXXX` escapes, so the output never
 * contains `</script>` or `<!--` and parses on pre-ES2019 engines.
 *
 * Values JSON cannot represent follow `JSON.stringify` (functions are
 * dropped); a top-level `undefined` becomes `null`.
 */
export function safeJSON(value: unknown): string {
  const json = JSON.stringify(value) as string | undefined;
  if (json === undefined) return 'null';
  return json.replace(UNSAFE_CHARACTERS, (char) => ESCAPES[char] ?? char);
}

/**
 * Returns a double-quoted JS string literal that evaluates to `value`.
 * Quotes, backslashes, backticks, `${` and line terminators cannot escape the
 * literal, and the result is safe inside an inline `<script>` element.
 */
export function jsStringLiteral(value: string): string {
  return safeJSON(String(value));
}
