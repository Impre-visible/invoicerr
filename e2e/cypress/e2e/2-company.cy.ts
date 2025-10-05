beforeEach(() => {
  cy.readFile('cypress/fixtures/session.json').then((tokens) => {
    if (tokens.access_token) {
      cy.setCookie('access_token', tokens.access_token);
    }
    if (tokens.refresh_token) {
      cy.setCookie('refresh_token', tokens.refresh_token);
    }
  });
});

describe('Company E2E', () => {
  it('allows to fill in company settings', () => {
    cy.visit('/settings/company');

    cy.get('input[name=name]').clear().type('Acme Corp');
    cy.get('input[name=description]').clear().type('A fictional company');
    cy.get('input[name=legalId]').clear().type('LEGAL123456');
    cy.get('input[name=VAT]').clear().type('VAT123456');
    cy.get('input[name=phone]').clear().type('+1234567890');
    cy.get('input[name=email]').clear().type('contact@acme.org');
    cy.get('input[name=address]').clear().type('123 Main St');
    cy.get('input[name=city]').clear().type('Metropolis');
    cy.get('input[name=postalCode]').clear().type('12345');
    cy.get('input[name=country]').clear().type('USA');

    cy.get('button.font-normal:nth-child(1)').click(); // Open currency dropdown
    cy.get('input[placeholder="Search currencies..."]').type('USD');
    cy.get('button').contains('United States Dollar ($)').click();

    cy.get('div.bg-card:nth-child(5) > div:nth-child(2) > div:nth-child(1) > button:nth-child(2)').click(); // Open Invoice PDF Format dropdown
    cy.get('div.bg-card:nth-child(5) > div:nth-child(2) > div:nth-child(1) > select:nth-child(3)').select('facturx', { force: true }); // Select Factur-X

    cy.get('div.bg-card:nth-child(5) > div:nth-child(2) > div:nth-child(2) > button:nth-child(2)').click(); // Open Date Format dropdown
    cy.get('div.bg-card:nth-child(5) > div:nth-child(2) > div:nth-child(2) > select:nth-child(3)').select('dd/MM/yyyy', { force: true }); // Select DD/MM/YYYY

    cy.get('button[type=submit]').click();

    cy.wait(500); // Wait for save & refresh

    cy.get('input[name=name]').should('have.value', 'Acme Corp');
    cy.get('input[name=description]').should('have.value', 'A fictional company');
    cy.get('input[name=legalId]').should('have.value', 'LEGAL123456');
    cy.get('input[name=VAT]').should('have.value', 'VAT123456');
    cy.get('input[name=phone]').should('have.value', '+1234567890');
    cy.get('input[name=email]').should('have.value', 'contact@acme.org');
  })
})