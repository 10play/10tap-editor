import { normalizeHref } from '../normalizeHref';

describe('normalizeHref (#255)', () => {
  it.each([
    ['www.google.com', 'https://www.google.com'],
    ['google.com/search?q=1', 'https://google.com/search?q=1'],
    ['  www.google.com  ', 'https://www.google.com'],
    ['//cdn.example.com/a.png', 'https://cdn.example.com/a.png'],
    ['example.com:8080/path', 'https://example.com:8080/path'],
    ['localhost:3000', 'https://localhost:3000'],
    ['user@example.com', 'mailto:user@example.com'],
    [' support@acme.co.uk ', 'mailto:support@acme.co.uk'],
  ])('adds a protocol to %j', (href, expected) => {
    expect(normalizeHref(href)).toBe(expected);
  });

  it.each([
    'https://10play.dev',
    'http://10play.dev',
    'HTTPS://10play.dev',
    'mailto:hello@10play.dev',
    'tel:+15551234',
    'tel:5551234',
    'myapp://open/item',
    'com.example.app:/callback',
    '/relative/path',
    '#section',
    '?query=1',
    './file.html',
    '../up.html',
  ])('keeps %j', (href) => {
    expect(normalizeHref(href)).toBe(href);
  });

  it('uses the given default protocol', () => {
    expect(normalizeHref('example.com', 'http')).toBe('http://example.com');
  });

  it('trims whitespace-only input to an empty link', () => {
    expect(normalizeHref('   ')).toBe('');
  });
});
