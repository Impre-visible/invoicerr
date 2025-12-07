describe('Authentication E2E', () => {
    let invitationCode: string;

    it('allows the first user to sign up without invitation code', () => {
        cy.visit('/auth/sign-up');
        cy.get('input[id=firstname]').type('John');
        cy.get('input[id=lastname]').type('Doe');
        cy.get('input[name=email]').type('john.doe@acme.org');
        cy.get('input[name=password]').type('Super_Secret_Password123!');
        cy.get('button[type=submit]').click();
        cy.url({ timeout: 10000 }).should('include', '/auth/sign-in');
    });

    it('allows the first user to login', () => {
        cy.login();
    });

    it('blocks signup without invitation code for second user', () => {
        cy.visit('/auth/sign-up');
        cy.get('input[id=invitationCode]', { timeout: 10000 }).should('exist');
        cy.get('input[id=firstname]').type('Jane');
        cy.get('input[id=lastname]').type('Smith');
        cy.get('input[name=email]').type('jane.smith@acme.org');
        cy.get('input[name=password]').type('Super_Secret_Password123!');
        cy.get('button[type=submit]').click();
        cy.contains('invitation code is required', { matchCase: false });
    });

    it('creates an invitation code', () => {
        cy.login();
        cy.visit('/settings/invitations');
        cy.get('button').contains('Generate', { matchCase: false }).click();
        cy.contains('Code copied', { matchCase: false, timeout: 5000 });

        // Wait for the table to be updated and fetch the invitation code via API
        cy.wait(1000);
        cy.getCookie('better-auth.session_token').then((cookie) => {
            cy.request({
                method: 'GET',
                url: `${Cypress.env('BACKEND_URL') || 'http://localhost:3000'}/invitations`,
                headers: {
                    Cookie: `better-auth.session_token=${cookie?.value}`,
                },
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.length.greaterThan(0);
                // Get the most recent unused invitation code
                const unusedInvitation = response.body.find((inv: any) => !inv.usedAt);
                expect(unusedInvitation).to.exist;
                invitationCode = unusedInvitation.code;
                expect(invitationCode).to.have.length.greaterThan(10);
            });
        });
    });

    it('allows signup with valid invitation code', () => {
        expect(invitationCode).to.exist;
        cy.visit('/auth/sign-up');
        cy.get('input[id=invitationCode]', { timeout: 10000 }).type(invitationCode);
        cy.get('input[id=firstname]').type('Jane');
        cy.get('input[id=lastname]').type('Smith');
        cy.get('input[name=email]').type('jane.smith@acme.org');
        cy.get('input[name=password]').type('Super_Secret_Password123!');
        cy.get('button[type=submit]').click();
        cy.url({ timeout: 10000 }).should('include', '/auth/sign-in');
    });

    it('blocks signup with already used invitation code', () => {
        expect(invitationCode).to.exist;
        cy.visit('/auth/sign-up');
        cy.get('input[id=invitationCode]', { timeout: 10000 }).type(invitationCode);
        cy.get('input[id=firstname]').type('Bob');
        cy.get('input[id=lastname]').type('Wilson');
        cy.get('input[name=email]').type('bob.wilson@acme.org');
        cy.get('input[name=password]').type('Super_Secret_Password123!');
        cy.get('button[type=submit]').click();
        cy.contains('already been used', { matchCase: false, timeout: 5000 });
    });

    it('shows error with wrong credentials', () => {
        cy.visit('/auth/sign-in');
        cy.get('input[name=email]').type('wrong@example.com');
        cy.get('input[name=password]').type('wrongpassword');
        cy.get('button[type=submit]').click();
        cy.contains('Invalid credentials');
    });
});
