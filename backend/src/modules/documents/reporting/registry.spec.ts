/**
 * The reporting-obligation mechanism itself — read as DATA (this spec proves it, never a hard-coded
 * `if countryCode === 'HU'` anywhere in the product code), the same discipline
 * `transports/channel-policy/registry.spec.ts` already holds for its own mechanism.
 */
import { ALL_REPORTING_OBLIGATION_FILES } from './data/all';
import { assertValidReportingObligationFact } from './schema';
import { defaultReportingObligationCatalog, ReportingObligationCatalog } from './registry';

describe('reporting obligation files — loaded, not hard-coded', () => {
  // HU ("nav") and GR ("mydata") — the only two countries this mechanism ever shipped a reporting
  // obligation for — were both removed by the 5-country prune (2026-09-10, see this task's own
  // report): FR/PL/IT/PT/DE never had a data/xx.json here. This mechanism's shipped set is now
  // honestly EMPTY — `ALL_REPORTING_OBLIGATION_FILES` is `[]` (data/all.ts's own readdir-discovery
  // over a directory with no `*.json` left) — and the registry tolerates that cleanly: every lookup
  // below behaves exactly like "a country with no file", never a crash or a permissive fallback. The
  // `nav-client.ts`/`mydata-client.ts` PROVIDER implementations are left in place (see this task's own
  // report) — they are reachable again the moment a country data file names their `providerId`.
  it('the shipped catalog is empty — GR and HU were the only two countries, both removed by the 5-country prune', () => {
    expect(ALL_REPORTING_OBLIGATION_FILES).toEqual([]);
  });

  it('a country with NO reporting-obligation file at all (e.g. FR, or the formerly-shipped HU/GR) has no fact and no obligation — never a crash', () => {
    for (const countryCode of ['FR', 'HU', 'GR']) {
      expect(defaultReportingObligationCatalog.factsFor(countryCode)).toEqual([]);
      expect(defaultReportingObligationCatalog.obligationFor(countryCode, 'invoice')).toBeUndefined();
    }
  });

  it('lower-cased or absent country codes never crash — no fact, not a throw', () => {
    expect(defaultReportingObligationCatalog.factsFor('fr')).toEqual(
      defaultReportingObligationCatalog.factsFor('FR'),
    );
    expect(defaultReportingObligationCatalog.factsFor('')).toEqual([]);
    expect(defaultReportingObligationCatalog.obligationFor(undefined, 'invoice')).toBeUndefined();
  });

  it('every shipped file has already passed provenance validation at load time — vacuously true over an empty set, not a crash', () => {
    expect(ALL_REPORTING_OBLIGATION_FILES.length).toBe(0);
    for (const file of ALL_REPORTING_OBLIGATION_FILES) {
      for (const fact of file.facts) {
        expect(() => assertValidReportingObligationFact(fact, 'test')).not.toThrow();
      }
    }
  });

  it('a bespoke catalog (constructor injection) is independent of the shipped one — the shipped catalog, now empty, is NOT implicitly merged in, and vice versa', () => {
    const custom = new ReportingObligationCatalog([
      {
        countryCode: 'ZZ',
        facts: [
          {
            providerId: 'fixture-provider',
            appliesTo: 'invoice',
            provenance: { kind: 'unverified', resolutionNote: 'test fixture' },
          },
        ],
      },
    ]);
    expect(custom.obligationFor('ZZ', 'invoice')?.providerId).toBe('fixture-provider');
    expect(defaultReportingObligationCatalog.factsFor('ZZ')).toEqual([]);
  });
});
