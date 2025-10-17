beforeEach(() => {
  cy.login();
  cy.visit('/');
});

describe('Payment Methods E2E', () => {
  it('allows to create a payment method (Bank Transfer)', () => {
    cy.visit('/payment-methods')
    cy.get('button > span').contains('Add payment method').click({ force: true });

    cy.get('[name="name"]').clear();
    cy.get('[name="name"]').type('Bank Transfer');

    cy.get('[name="details"]').clear();
    cy.get('[name="details"]').type('Transfer funds directly to the bank account');

    cy.get('#radix-«r7» > form > div.flex.justify-end.gap-2 > button[type="submit"]').click();

    cy.wait(2000); // wait for the toast to appear
    cy.contains('Bank Transfer')
    cy.contains('Transfer funds directly to the bank account')
  })

  it('allows to create a payment method (PayPal)', () => {
    cy.visit('/payment-methods')
    cy.get('button > span').contains('Add payment method').click({ force: true });

    cy.get('[name="name"]').clear();
    cy.get('[name="name"]').type('PayPal');

    cy.get('[name="details"]').clear();
    cy.get('[name="details"]').type('Pay via PayPal; you can pay with your credit card if you don\'t have a PayPal account');

    cy.get('[aria-label="Type"]').click();
    cy.wait(200); // wait for the dropdown to open
    cy.get('#radix-«rm» > div > div:nth-child(2)').click(); // Select PayPal

    cy.get('#radix-«r7» > form > div.flex.justify-end.gap-2 > button[type="submit"]').click(); // submit the form

    cy.wait(2000); // wait for the toast to appear
    cy.contains('PayPal')
    cy.contains('Pay via PayPal; you can pay with your credit card if you don\'t have a PayPal account')
  })
})