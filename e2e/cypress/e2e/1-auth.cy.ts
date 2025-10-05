describe('Authentication E2E', () => {
    it('allows a user to sign up', () => {
        cy.visit('/signup');
        cy.get('input[id=firstname]').type('John');
        cy.get('input[id=lastname]').type('Doe');
        cy.get('input[name=email]').type('john.doe@acme.org');
        cy.get('input[name=password]').type('Super_Secret_Password123!');
        cy.get('button[type=submit]').click();
        cy.contains('Account created successfully');

    });

    it('allows a user to login', () => {
        cy.login();
        cy.contains('Successfully signed in');
        cy.url().should('eq', `${Cypress.config().baseUrl}/dashboard`);
    });

    it('shows error with wrong credentials', () => {
        cy.visit('/login');
        cy.get('input[name=email]').type('wrong@example.com');
        cy.get('input[name=password]').type('wrongpassword');
        cy.get('button[type=submit]').click();
        cy.contains('Invalid credentials');
    });
});
