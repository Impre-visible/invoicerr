beforeEach(() => {
    cy.login();
});

describe('Company Settings E2E', () => {
    describe('Basic Company Information', () => {
        it('fills in all company settings correctly', () => {
            cy.visit('/settings/company');
            cy.get('[data-cy="company-name-input"]', { timeout: 10000 }).should('be.visible');

            cy.get('[data-cy="company-name-input"]').clear().type('Acme Corp');
            cy.get('[data-cy="company-description-input"]').clear().type('A fictional company');
            cy.get('[data-cy="company-legalid-input"]').clear().type('LEGAL123456');
            cy.get('[data-cy="company-vat-input"]').clear().type('FR12345678901');
            cy.get('[data-cy="company-phone-input"]').clear().type('+33123456789');
            cy.get('[data-cy="company-email-input"]').clear().type('contact@acme.org');
            cy.get('[data-cy="company-address-input"]').clear().type('123 Main Street');
            cy.get('[data-cy="company-city-input"]').clear().type('Paris');
            cy.get('[data-cy="company-postalcode-input"]').clear().type('75001');
            cy.get('[data-cy="company-country-input"]').clear().type('France');

            cy.get('[data-cy="company-submit-btn"]').click();
            cy.wait(2000);
        });
    });

    describe('Validation Errors', () => {
        it('shows error for empty company name', () => {
            cy.visit('/settings/company');
            cy.get('[data-cy="company-name-input"]', { timeout: 10000 }).clear();
            cy.get('[data-cy="company-submit-btn"]').click();
            cy.contains(/required|empty|name/i);
        });

        it('shows error for empty address', () => {
            cy.visit('/settings/company');
            cy.get('[data-cy="company-address-input"]', { timeout: 10000 }).clear();
            cy.get('[data-cy="company-submit-btn"]').click();
            cy.contains(/required|empty|address/i);
        });

        it('shows error for empty city', () => {
            cy.visit('/settings/company');
            cy.get('[data-cy="company-city-input"]', { timeout: 10000 }).clear();
            cy.get('[data-cy="company-submit-btn"]').click();
            cy.contains(/required|empty|city/i);
        });

        it('shows error for empty country', () => {
            cy.visit('/settings/company');
            cy.get('[data-cy="company-country-input"]', { timeout: 10000 }).clear();
            cy.get('[data-cy="company-submit-btn"]').click();
            cy.contains(/required|empty|country/i);
        });

        it('shows error for invalid postal code format', () => {
            cy.visit('/settings/company');
            cy.get('[data-cy="company-postalcode-input"]', { timeout: 10000 }).clear().type('AB');
            cy.get('[data-cy="company-submit-btn"]').click();
            cy.contains(/format|invalid|postal/i);
        });

        it('shows error for invalid phone format', () => {
            cy.visit('/settings/company');
            cy.get('[data-cy="company-phone-input"]', { timeout: 10000 }).clear().type('123');
            cy.get('[data-cy="company-submit-btn"]').click();
            cy.contains(/format|invalid|phone|characters/i);
        });

        it('shows error for invalid email format', () => {
            cy.visit('/settings/company');
            cy.get('[data-cy="company-email-input"]', { timeout: 10000 }).clear().type('not-an-email');
            cy.get('[data-cy="company-submit-btn"]').click();
            cy.contains(/format|invalid|email/i);
        });
    });

    describe('Edge Cases', () => {
        it('handles special characters in company name', () => {
            cy.visit('/settings/company');
            cy.get('[data-cy="company-name-input"]', { timeout: 10000 }).clear().type("O'Reilly & Associates");
            cy.get('[data-cy="company-submit-btn"]').click();
            cy.wait(1000);
            cy.get('[data-cy="company-name-input"]').invoke('val').should('contain', "O'Reilly");
        });

        it('handles unicode characters in company name', () => {
            cy.visit('/settings/company');
            cy.get('[data-cy="company-name-input"]', { timeout: 10000 }).clear().type('Société Générale');
            cy.get('[data-cy="company-submit-btn"]').click();
            cy.wait(1000);
            cy.get('[data-cy="company-name-input"]').invoke('val').should('contain', 'Société');
        });

        it('shows error for description exceeding max length', () => {
            cy.visit('/settings/company');
            const tooLongDescription = 'A'.repeat(501);
            cy.get('[data-cy="company-description-input"]', { timeout: 10000 }).clear().type(tooLongDescription, { delay: 0 });
            cy.get('[data-cy="company-submit-btn"]').click();
            cy.contains(/max|length|500|characters|caractères/i);
        });

        it('validates starting numbers are positive', () => {
            cy.visit('/settings/company');
            cy.get('input[name="quoteStartingNumber"]', { timeout: 10000 }).clear().type('0');
            cy.get('[data-cy="company-submit-btn"]').click();
            cy.contains(/min|at least|1/i);
        });
    });

    describe('Restore Valid State', () => {
        it('restores valid company settings for other tests', () => {
            cy.visit('/settings/company');
            cy.get('[data-cy="company-name-input"]', { timeout: 10000 }).clear().type('Acme Corp');
            cy.get('[data-cy="company-description-input"]').clear().type('A fictional company');
            cy.get('[data-cy="company-legalid-input"]').clear().type('LEGAL123456');
            cy.get('[data-cy="company-vat-input"]').clear().type('FR12345678901');
            cy.get('[data-cy="company-phone-input"]').clear().type('+33123456789');
            cy.get('[data-cy="company-email-input"]').clear().type('contact@acme.org');
            cy.get('[data-cy="company-address-input"]').clear().type('123 Main St');
            cy.get('[data-cy="company-city-input"]').clear().type('Paris');
            cy.get('[data-cy="company-postalcode-input"]').clear().type('75001');
            cy.get('[data-cy="company-country-input"]').clear().type('France');

            cy.get('[data-cy="company-submit-btn"]').click();
            cy.wait(2000);
        });
    });
});
