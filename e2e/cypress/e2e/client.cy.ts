describe('Client E2E', () => {
    it('allows to create a new client (Company)', () => {
        cy.login()
        cy.visit('/clients')
        cy.get('#root .md\\:inline-flex').click();
        cy.get('[name="contactFirstname"]').clear();
        cy.get('[name="contactFirstname"]').type('John');
        cy.get('[name="contactLastname"]').clear();
        cy.get('[name="contactLastname"]').type('Doe');

        cy.get('[name="name"]').clear();
        cy.get('[name="name"]').type('ACME');

        cy.get('[name="description"]').click();
        cy.get('[name="description"]').clear();
        cy.get('[name="description"]').type('ACME Description');

        cy.get('[name="legalId"]').click();
        cy.get('[name="legalId"]').clear();
        cy.get('[name="legalId"]').type('US12345678');

        cy.get('#radix-«r7» .flex-wrap span').click();
        cy.get('#radix-«r7» .h-8').clear();
        cy.get('#radix-«r7» .h-8').type('Euro');
        cy.get('#radix-«r7» .rounded-sm span').click();

        cy.get('[name="contactEmail"]').clear();
        cy.get('[name="contactEmail"]').type('john.doe@acme.org');

        cy.get('[name="contactPhone"]').clear();
        cy.get('[name="contactPhone"]').type('+1 23 456 789');

        cy.get('[name="address"]').clear();
        cy.get('[name="address"]').type('123 Street Name');

        cy.get('[name="postalCode"]').clear();
        cy.get('[name="postalCode"]').type('12345');

        cy.get('[name="city"]').clear();
        cy.get('[name="city"]').type('City');

        cy.get('[name="country"]').clear();
        cy.get('[name="country"]').type('Country');
        cy.get('#radix-«r7» .text-primary-foreground').click();

        cy.contains('ACME')
        cy.contains('Active')
    })

    it('allows to create a new client (Individual)', () => {
        cy.login()
        cy.visit('/clients')
        cy.get('#root .md\\:inline-flex').click();
        cy.get('[name="contactFirstname"]').clear();
        cy.get('[name="contactFirstname"]').type('Jane');
        cy.get('[name="contactLastname"]').clear();
        cy.get('[name="contactLastname"]').type('Doe');

        //cy.get('button.border-input').click();
        cy.get('select').select('INDIVIDUAL', { force: true });

        cy.get('[name="description"]').click();
        cy.get('[name="description"]').clear();
        cy.get('[name="description"]').type('ACME Description');

        cy.get('#radix-«r7» .flex-wrap span').click();
        cy.get('#radix-«r7» .h-8').clear();
        cy.get('#radix-«r7» .h-8').type('Euro');
        cy.get('#radix-«r7» .rounded-sm span').click();

        cy.get('[name="contactEmail"]').clear();
        cy.get('[name="contactEmail"]').type('jane.doe@acme.org');

        cy.get('[name="contactPhone"]').clear();
        cy.get('[name="contactPhone"]').type('+1 23 456 789');

        cy.get('[name="address"]').clear();
        cy.get('[name="address"]').type('123 Street Name');

        cy.get('[name="postalCode"]').clear();
        cy.get('[name="postalCode"]').type('12345');

        cy.get('[name="city"]').clear();
        cy.get('[name="city"]').type('City');

        cy.get('[name="country"]').clear();
        cy.get('[name="country"]').type('Country');
        cy.get('#radix-«r7» .text-primary-foreground').click();

        cy.contains('Jane Doe')
        cy.contains('Active')
    })
});