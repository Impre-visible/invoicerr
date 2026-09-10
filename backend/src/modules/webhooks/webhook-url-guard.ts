// Namespace imports, not default imports: `import net from 'node:net'` compiles cleanly under
// `nest build` (which emits the `__importDefault` interop helper) but resolves to `undefined` under
// this project's ts-jest config (no `esModuleInterop`, and ts-jest does not add the helper on its
// own) — every jest test in this file would otherwise crash on `net.isIP is not a function`, guard
// completely untested. `import * as net` sidesteps the interop helper entirely and behaves
// identically under both compilers.
import * as dns from 'node:dns';
import * as net from 'node:net';

/**
 * SSRF guard for outbound webhook URLs — SECURITY_AUDIT.md finding #2 ("Haute").
 *
 * A webhook `url` is set by an OWNER/ADMIN of a tenant (or a compromised account, or — in a
 * multi-tenant SaaS deployment — another tenant entirely), yet the HTTP request it triggers is
 * emitted by the invoicerr server itself, from the server's own network. Without this guard, a
 * webhook pointed at `http://169.254.169.254/...` (cloud instance metadata) or
 * `http://some-internal-service:port/` turns every webhook-firing event into an authenticated SSRF
 * primitive against invoicerr's own infrastructure.
 *
 * `assertPublicWebhookUrl` is called from two places, deliberately:
 *  - `webhooks.service.ts` create/update — reject bad input before it is ever persisted.
 *  - `webhooks.service.ts#send` — re-run right before *every* dispatch. DNS is not a fact fixed at
 *    creation time: a hostname that resolved to a public IP when the webhook was created can be
 *    repointed at a private one by the time an event actually fires ("DNS rebinding"). Re-resolving
 *    on every send closes that window; validating once at rest does not.
 *
 * This function does not itself decide HTTP status codes or log anything — it throws
 * `WebhookUrlValidationError` with an internal `reason` string. Callers must NOT surface `reason` or
 * the raw URL back to the client or into logs verbatim: doing so turns the validator into a scanning
 * oracle ("is 10.0.3.4 open? is 169.254.x.y blocked? what about 172.20.0.1?").
 */
export class WebhookUrlValidationError extends Error {
  constructor(public readonly reason: string) {
    super(`webhook URL rejected: ${reason}`);
    this.name = 'WebhookUrlValidationError';
  }
}

// Hostnames that must never be dispatched to regardless of what they resolve to (or even if they
// fail to resolve via the public DNS path at all — e.g. metadata.google.internal is only reachable
// from inside GCP, but a self-hosted invoicerr instance running there would resolve it).
const BLOCKED_LITERAL_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal', // GCP instance metadata
  'metadata', // short form also used by GCP's resolver
]);

function isPrivateIpv4(address: string): boolean {
  const octets = address.split('.').map(Number);
  // Anything that doesn't parse as 4 clean octets is never "known safe" — fail closed.
  if (octets.length !== 4 || octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;

  const [a, b] = octets;
  if (a === 0) return true; // 0.0.0.0/8 — "this network"
  if (a === 10) return true; // RFC1918
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local — covers cloud metadata IPs
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
  if (a === 192 && b === 168) return true; // RFC1918
  if (a === 100 && b >= 64 && b <= 127) return true; // RFC6598 carrier-grade NAT — extra safety net
  return false;
}

/**
 * Expands any valid textual IPv6 address (including "::" compression and a trailing embedded IPv4,
 * e.g. "::ffff:1.2.3.4" or "64:ff9b::1.2.3.4") into its 128-bit value, so ranges can be checked by
 * integer comparison instead of fragile string prefix matching against every possible spelling.
 * Returns null for anything that doesn't parse.
 */
function expandIpv6(address: string): bigint | null {
  const zoneIdx = address.indexOf('%');
  const addr = zoneIdx === -1 ? address : address.slice(0, zoneIdx);
  if (!net.isIPv6(addr)) return null;

  // An embedded IPv4 tail (only ever legal at the very end of the address) is converted to two
  // hex groups and folded into the "right-hand side" groups below.
  const ipv4Match = addr.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  let head = addr;
  let ipv4Groups: string[] = [];
  if (ipv4Match) {
    const octets = ipv4Match[1].split('.').map(Number);
    if (octets.some((n) => n > 255)) return null;
    ipv4Groups = [((octets[0] << 8) | octets[1]).toString(16), ((octets[2] << 8) | octets[3]).toString(16)];
    head = addr.slice(0, addr.length - ipv4Match[1].length);
    // Only strip a lone separating ':' — a trailing "::" is the compression marker itself and must
    // survive so the split below still finds it.
    if (!head.endsWith('::') && head.endsWith(':')) head = head.slice(0, -1);
  }

  const halves = head.split('::');
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(':').filter(Boolean) : [];
  const right = halves.length > 1 && halves[1] ? halves[1].split(':').filter(Boolean) : [];
  const rightAll = [...right, ...ipv4Groups];

  const missing = 8 - left.length - rightAll.length;
  if (missing < 0) return null;
  if (halves.length === 1 && missing !== 0) return null; // no "::" present -> must be exactly 8 groups

  const groups = [...left, ...Array(missing).fill('0'), ...rightAll];
  if (groups.length !== 8) return null;

  let value = 0n;
  for (const group of groups) {
    const n = Number.parseInt(group || '0', 16);
    if (!Number.isInteger(n) || n < 0 || n > 0xffff) return null;
    value = (value << 16n) | BigInt(n);
  }
  return value;
}

function ipv6PrefixMatches(value: bigint, prefixAddress: string, prefixLength: number): boolean {
  const base = expandIpv6(prefixAddress);
  if (base === null) return false;
  const shift = BigInt(128 - prefixLength);
  return value >> shift === base >> shift;
}

function isPrivateIpv6(address: string): boolean {
  const value = expandIpv6(address);
  if (value === null) return true; // unparsable literal -> fail closed, never "known safe"

  if (value === 0n) return true; // :: (unspecified)
  if (value === 1n) return true; // ::1 (loopback)
  if (ipv6PrefixMatches(value, 'fe80::', 10)) return true; // link-local
  if (ipv6PrefixMatches(value, 'fc00::', 7)) return true; // unique-local (fc00::/7)

  // IPv4-mapped addresses (::ffff:0:0/96) — check the embedded IPv4 with the same rules, however the
  // address was spelled (dotted-quad tail, or the raw hex groups the WHATWG URL parser normalizes it
  // to, e.g. "::ffff:169.254.169.254" and "::ffff:a9fe:a9fe" carry the same 128-bit value).
  if (ipv6PrefixMatches(value, '::ffff:0:0', 96)) {
    const v4 = value & 0xffffffffn;
    const octet = (shift: bigint) => Number((v4 >> shift) & 0xffn);
    return isPrivateIpv4(`${octet(24n)}.${octet(16n)}.${octet(8n)}.${octet(0n)}`);
  }

  return false;
}

/**
 * Throws `WebhookUrlValidationError` unless `rawUrl` is a well-formed http(s) URL whose hostname
 * resolves exclusively to public, routable addresses. Resolves the hostname for real (`dns.lookup`)
 * rather than trusting a literal IP alone — literal IPs are also checked directly, without a DNS
 * round-trip, since they're never subject to rebinding but must still be rejected up front.
 */
export async function assertPublicWebhookUrl(rawUrl: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new WebhookUrlValidationError('malformed URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new WebhookUrlValidationError('unsupported URL scheme');
  }

  // Dev/test-only escape hatch — NEVER set in production. The scheme check above STILL runs (file:,
  // gopher:… stay rejected); only the private/loopback/link-local blocking below is skipped, so the
  // e2e webhook-delivery suite (42-webhooks) can point a webhook at its own in-process localhost
  // receiver. `start:test` sets it via .env.test; jest does not load .env.test, and production must
  // never define it — the SSRF guard is fully enforced everywhere else. See SECURITY_AUDIT.md #2.
  if (process.env.ALLOW_PRIVATE_WEBHOOK_URLS === '1') return;

  const bracketed = parsed.hostname.toLowerCase();
  const hostname = bracketed.startsWith('[') && bracketed.endsWith(']') ? bracketed.slice(1, -1) : bracketed;

  if (!hostname || BLOCKED_LITERAL_HOSTNAMES.has(hostname)) {
    throw new WebhookUrlValidationError('blocked hostname');
  }

  const literalIpVersion = net.isIP(hostname);
  if (literalIpVersion === 4) {
    if (isPrivateIpv4(hostname)) throw new WebhookUrlValidationError('literal address is private/internal');
    return;
  }
  if (literalIpVersion === 6) {
    if (isPrivateIpv6(hostname)) throw new WebhookUrlValidationError('literal address is private/internal');
    return;
  }

  // Not a literal IP: resolve for real and check every returned address. A hostname can carry both
  // an A and AAAA record, or several of either — one public answer does not make the others safe.
  let addresses: dns.LookupAddress[];
  try {
    addresses = await dns.promises.lookup(hostname, { all: true });
  } catch {
    throw new WebhookUrlValidationError('hostname does not resolve');
  }

  if (addresses.length === 0) {
    throw new WebhookUrlValidationError('hostname does not resolve');
  }

  for (const { address, family } of addresses) {
    const isPrivate = family === 6 ? isPrivateIpv6(address) : isPrivateIpv4(address);
    if (isPrivate) {
      throw new WebhookUrlValidationError('hostname resolves to a private/internal address');
    }
  }
}
