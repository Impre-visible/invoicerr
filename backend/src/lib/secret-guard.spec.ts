import {
  InsecureSecretFinding,
  assertSecretsConfiguredForBoot,
  findInsecureSecret,
  insecureSecretMessage,
} from '@/lib/secret-guard';

describe('findInsecureSecret', () => {
  it('is null (secure) for a real, random BETTER_AUTH_SECRET', () => {
    expect(
      findInsecureSecret({
        BETTER_AUTH_SECRET: 'f3a1c9d8e7b6a5f4c3d2e1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0',
      }),
    ).toBeNull();
  });

  it('is null (secure) when only JWT_SECRET is a real random value (legacy fallback deployment)', () => {
    expect(
      findInsecureSecret({ JWT_SECRET: 'f3a1c9d8e7b6a5f4c3d2e1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0' }),
    ).toBeNull();
  });

  it('is empty when neither variable is set', () => {
    expect(findInsecureSecret({})).toEqual({ variable: 'BETTER_AUTH_SECRET', reason: 'empty' });
  });

  it.each(['', '   ', '\t\n'])('treats BETTER_AUTH_SECRET=%p as empty, not a real value', (value) => {
    expect(findInsecureSecret({ BETTER_AUTH_SECRET: value })).toEqual({
      variable: 'BETTER_AUTH_SECRET',
      reason: 'empty',
    });
  });

  it('flags the original docker-compose.yml example values, exactly as committed', () => {
    // The actual finding #3 scenario: both example values from the pre-fix docker-compose.yml,
    // unmodified by a copy-paste deployment.
    expect(
      findInsecureSecret({ JWT_SECRET: 'your_jwt_secret', BETTER_AUTH_SECRET: 'your_better_auth_secret' }),
    ).toEqual({ variable: 'BETTER_AUTH_SECRET', reason: 'placeholder', value: 'your_better_auth_secret' });
  });

  it('flags the current docker-compose.yml placeholder (CHANGE_ME_generate_with_openssl_rand_hex_32)', () => {
    const finding = findInsecureSecret({ BETTER_AUTH_SECRET: 'CHANGE_ME_generate_with_openssl_rand_hex_32' });
    expect(finding).toEqual({
      variable: 'BETTER_AUTH_SECRET',
      reason: 'placeholder',
      value: 'CHANGE_ME_generate_with_openssl_rand_hex_32',
    });
  });

  it.each([
    'changeme',
    'CHANGEME',
    'secret',
    'password',
    'your-secret',
    'your_super_secret_key',
  ])('flags known/obvious placeholder %p', (value) => {
    const finding = findInsecureSecret({ BETTER_AUTH_SECRET: value });
    expect(finding?.reason).toBe('placeholder');
  });

  it('only checks the EFFECTIVE secret: a placeholder left in the unused variable does not trip the guard', () => {
    // BETTER_AUTH_SECRET wins the `||` fallback in lib/auth.ts — a stale JWT_SECRET placeholder
    // that is never actually read must not fail a correctly-configured deployment.
    expect(
      findInsecureSecret({
        BETTER_AUTH_SECRET: 'f3a1c9d8e7b6a5f4c3d2e1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0',
        JWT_SECRET: 'your_jwt_secret',
      }),
    ).toBeNull();
  });

  it('falls back to JWT_SECRET, and flags it, when BETTER_AUTH_SECRET is unset (legacy-only deployment)', () => {
    expect(findInsecureSecret({ JWT_SECRET: 'your_jwt_secret' })).toEqual({
      variable: 'JWT_SECRET',
      reason: 'placeholder',
      value: 'your_jwt_secret',
    });
  });

  it('matches .env.example: only BETTER_AUTH_SECRET set, JWT_SECRET absent — a real value passes', () => {
    // .env.example never sets JWT_SECRET at all; a deployment that follows it correctly must not
    // be failed over a variable it was never told to set.
    expect(
      findInsecureSecret({
        BETTER_AUTH_SECRET: 'f3a1c9d8e7b6a5f4c3d2e1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0',
      }),
    ).toBeNull();
  });
});

describe('insecureSecretMessage', () => {
  it('names the exact variable and is explicit for "empty"', () => {
    const finding: InsecureSecretFinding = { variable: 'BETTER_AUTH_SECRET', reason: 'empty' };
    const message = insecureSecretMessage(finding);
    expect(message).toContain('BETTER_AUTH_SECRET');
    expect(message).toContain('not set');
  });

  it('names the exact variable and the offending value for "placeholder"', () => {
    const finding: InsecureSecretFinding = {
      variable: 'JWT_SECRET',
      reason: 'placeholder',
      value: 'your_jwt_secret',
    };
    const message = insecureSecretMessage(finding);
    expect(message).toContain('JWT_SECRET');
    expect(message).toContain('your_jwt_secret');
  });
});

describe('assertSecretsConfiguredForBoot', () => {
  it('throws in production with an empty secret', () => {
    expect(() => assertSecretsConfiguredForBoot({ NODE_ENV: 'production' })).toThrow(/BETTER_AUTH_SECRET/);
  });

  it('throws in production with the docker-compose.yml example placeholder', () => {
    expect(() =>
      assertSecretsConfiguredForBoot({
        NODE_ENV: 'production',
        BETTER_AUTH_SECRET: 'your_better_auth_secret',
      }),
    ).toThrow(/placeholder/);
  });

  it('does not throw in production with a real secret (mutation check: a bypassed guard would pass this too)', () => {
    expect(() =>
      assertSecretsConfiguredForBoot({
        NODE_ENV: 'production',
        BETTER_AUTH_SECRET: 'f3a1c9d8e7b6a5f4c3d2e1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0',
      }),
    ).not.toThrow();
  });

  it('does NOT throw outside production even with an empty/placeholder secret — matches .env.test, which sets neither', () => {
    // This is the load-bearing assertion for "the guard must not break `npm run start:test`":
    // .env.test sets NODE_ENV=test and never sets BETTER_AUTH_SECRET/JWT_SECRET at all.
    expect(() => assertSecretsConfiguredForBoot({ NODE_ENV: 'test' })).not.toThrow();
    expect(() =>
      assertSecretsConfiguredForBoot({ NODE_ENV: 'test', BETTER_AUTH_SECRET: 'your_better_auth_secret' }),
    ).not.toThrow();
    expect(() => assertSecretsConfiguredForBoot({})).not.toThrow(); // NODE_ENV unset (plain dev)
  });
});
