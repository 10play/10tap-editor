/** `scheme:` as in RFC 3986 (`https:`, `mailto:`, `tel:`, `myapp:`). */
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;
/** `host:port`, which also matches SCHEME. */
const HOST_WITH_PORT = /^([^\s/?#:]+):\d+(?:[/?#]|$)/;
/** Links meant to stay relative: `/path`, `#anchor`, `?query`, `./file`. */
const RELATIVE = /^(?:\/(?!\/)|[#?.])/;

const isHost = (candidate: string) =>
  candidate.includes('.') || candidate.toLowerCase() === 'localhost';

const hasScheme = (href: string) => {
  if (!SCHEME.test(href)) return false;
  const hostWithPort = HOST_WITH_PORT.exec(href);
  return !(hostWithPort?.[1] && isHost(hostWithPort[1]));
};

/**
 * Adds `defaultProtocol` to links typed without one, so `www.example.com`
 * is not stored as a relative URL (#255). Links that have a scheme and
 * relative links are only trimmed.
 */
export function normalizeHref(href: string, defaultProtocol = 'https'): string {
  const trimmed = href.trim();
  if (!trimmed || RELATIVE.test(trimmed) || hasScheme(trimmed)) {
    return trimmed;
  }
  return `${defaultProtocol}://${trimmed.replace(/^\/\//, '')}`;
}
