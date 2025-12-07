describe('Authentication E2E', () => {
    it('allows a user to sign up', () => {
        cy.visit('/auth/sign-up');
        cy.get('input[id=firstname]').type('John');
        cy.get('input[id=lastname]').type('Doe');
        cy.get('input[name=email]').type('john.doe@acme.org');
        cy.get('input[name=password]').type('Super_Secret_Password123!');
        cy.get('button[type=submit]').click();
        // Wait for success message or redirect to login
        cy.url({ timeout: 10000 }).should('include', '/auth/sign-in');
    });

    it('allows a user to login', () => {
        cy.login();
    });

    it('shows error with wrong credentials', () => {
        cy.visit('/auth/sign-in');
        cy.get('input[name=email]').type('wrong@example.com');
        cy.get('input[name=password]').type('wrongpassword');
        cy.get('button[type=submit]').click();
        cy.contains('Invalid credentials');
    });
});
