/**
 * Boot-time guard against known-insecure auth secrets — SECURITY_AUDIT.md finding #3 (Haute).
 *
 * `docker-compose.yml` used to ship non-empty, PUBLIC (committed) example values for both
 * `JWT_SECRET` ("your_jwt_secret") and `BETTER_AUTH_SECRET` ("your_better_auth_secret"). Neither
 * looks empty, so a copy-pasted, unmodified compose file boots with zero warning and a
 * session/cookie-signing secret anyone can read on GitHub — total auth bypass (forge a valid
 * session for any userId, no password needed).
 *
 * better-auth's OWN `validateSecret` (node_modules/better-auth/dist/context/create-context.mjs)
 * does not catch this: it only compares the effective secret against ITS OWN internal
 * `DEFAULT_SECRET` constant, has no idea these two example strings exist, and skips validation
 * entirely under `isTest()`. This guard is a separate, explicit check for OUR OWN known-bad
 * values, independent of and in addition to that one.
 *
 * `findInsecureSecret` is a pure function — deliberately never reads `process.env` itself and
 * throws nothing — so a test can drive it "cold", with synthetic env objects, exactly like
 * `lib/registration-policy.ts`'s `decideRegistration`. `assertSecretsConfiguredForBoot` is the
 * thin, throwing wrapper actually called from `main.ts`.
 *
 * The effective secret is `BETTER_AUTH_SECRET || JWT_SECRET` — the EXACT fallback `lib/auth.ts`
 * itself uses (`secret: process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET`) — not each
 * variable checked independently. That matters: `.env.example` never sets `JWT_SECRET` at all
 * (only `BETTER_AUTH_SECRET`, documented there as the one that's actually required), so a
 * deployment that correctly sets only `BETTER_AUTH_SECRET` must NOT be failed over an unset
 * `JWT_SECRET` it never needed in the first place. Checking the effective value also means a
 * leftover placeholder in the variable that ISN'T actually used (e.g. `BETTER_AUTH_SECRET` is a
 * real secret but `JWT_SECRET` still says "your_jwt_secret") correctly does not trip the guard.
 *
 * Gated to `NODE_ENV === 'production'` only — see the call site in `main.ts` — NOT because a
 * placeholder is ever legitimate anywhere, but because neither `.env.test` nor a bare local `.env`
 * sets either variable at all (better-auth's own `DEFAULT_SECRET` fallback covers dev/test, and
 * `isTest()` skips its own validation there too), and putting a real secret into `.env.test` just
 * to satisfy an all-environments guard would mean committing a real secret to a versioned file —
 * worse than the problem this fixes. Production is also the only environment finding #3 actually
 * threatens (a placeholder deployed and reachable on the internet). Confirmed this choice does not
 * break `npm run start:test` (see `secret-guard.spec.ts`).
 */

const PLACEHOLDER_SECRETS: ReadonlySet<string> = new Set(
  [
    'your_jwt_secret',
    'your_better_auth_secret',
    'your-jwt-secret',
    'your-better-auth-secret',
    'changeme',
    'change_me',
    'change-me',
    'secret',
    'password',
    'your_secret',
    'your-secret',
    'example',
    // better-auth's own internal default (utils/constants.mjs) — belt and suspenders in case it
    // is ever passed through explicitly instead of left unset.
    'better-auth-secret-12345678901234567890',
  ].map((value) => value.toLowerCase()),
);

// Prefixes rather than exact strings: catches instructive placeholders like this repo's own
// `docker-compose.yml` value (`CHANGE_ME_generate_with_openssl_rand_hex_32`) without having to
// keep an exact-match list in sync with that file's exact wording, and generalises to the same
// boilerplate other self-hosted projects commonly use.
const PLACEHOLDER_PREFIXES: readonly string[] = [
  'your_',
  'your-',
  'change_me',
  'changeme',
  'change-me',
  'replace_me',
  'replace-me',
  'placeholder',
  'insert_',
  'todo_',
  'xxxx',
];

const looksLikePlaceholder = (value: string): boolean => {
  const normalized = value.toLowerCase();
  return (
    PLACEHOLDER_SECRETS.has(normalized) ||
    PLACEHOLDER_PREFIXES.some((prefix) => normalized.startsWith(prefix))
  );
};

export type InsecureSecretReason = 'empty' | 'placeholder';

export interface InsecureSecretFinding {
  /** The env var that actually supplies the effective secret (or would, if it weren't blank). */
  variable: 'BETTER_AUTH_SECRET' | 'JWT_SECRET';
  reason: InsecureSecretReason;
  /** Only set for reason "placeholder" — the offending value, for an explicit error message. */
  value?: string;
}

const blank = (raw: string | undefined): string | undefined => {
  const trimmed = (raw ?? '').trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/**
 * Pure check of the effective auth secret. Returns `null` when it is a real, non-placeholder
 * value; otherwise a finding naming the exact variable and reason so the caller can build an
 * explicit error message.
 */
export function findInsecureSecret(env: NodeJS.ProcessEnv = process.env): InsecureSecretFinding | null {
  const betterAuthSecret = blank(env.BETTER_AUTH_SECRET);
  const jwtSecret = blank(env.JWT_SECRET);
  const effective = betterAuthSecret ?? jwtSecret;

  if (!effective) {
    // Neither variable supplies anything: point at BETTER_AUTH_SECRET, the recommended/documented
    // one (`.env.example` never even mentions JWT_SECRET), regardless of whether JWT_SECRET also
    // happens to be blank — that's the actionable variable to set.
    return { variable: 'BETTER_AUTH_SECRET', reason: 'empty' };
  }
  if (looksLikePlaceholder(effective)) {
    // Non-blank: name whichever variable actually supplies the effective (bad) value — mirrors
    // lib/auth.ts's own `BETTER_AUTH_SECRET || JWT_SECRET` fallback exactly.
    const variable: 'BETTER_AUTH_SECRET' | 'JWT_SECRET' = betterAuthSecret
      ? 'BETTER_AUTH_SECRET'
      : 'JWT_SECRET';
    return { variable, reason: 'placeholder', value: effective };
  }
  return null;
}

export function insecureSecretMessage(finding: InsecureSecretFinding): string {
  const base =
    finding.reason === 'empty'
      ? `${finding.variable} is not set.`
      : `${finding.variable} is set to "${finding.value}", a well-known placeholder value.`;
  return (
    `[secret-guard] Refusing to boot: ${base} This signs every session cookie/JWT — set a real ` +
    `BETTER_AUTH_SECRET (generate one with \`openssl rand -hex 32\`); the docker-compose example ` +
    'value is public (committed to the repository) and must never be used as-is. See ' +
    'SECURITY_AUDIT.md finding #3.'
  );
}

/**
 * Throws a named, explicit error if the effective auth secret is empty or a known placeholder.
 * Called from `main.ts`, gated to `NODE_ENV === 'production'` — see this file's own header for
 * why. Takes `env` for testability; defaults to `process.env` at the real call site.
 */
export function assertSecretsConfiguredForBoot(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== 'production') {
    return;
  }
  const finding = findInsecureSecret(env);
  if (finding) {
    throw new Error(insecureSecretMessage(finding));
  }
}
