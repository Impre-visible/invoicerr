beforeEach(() => {
  cy.login();
  cy.visit('/quotes');
});

describe('Quotes E2E', () => {
    it('should create a quote (ACME)', () => {
        cy.get('#root div.flex-row.w-full span.hidden').click();
        cy.get('[name="title"]').type('Quote 1');

        // Select client
        cy.get('#radix-«r7» > form > div:nth-child(2) > div > button').click();
        cy.wait(200);
        cy.get("#radix-«r7» > form > div:nth-child(2) > div > div > div.max-h-60.overflow-auto.p-1.flex.flex-col.gap-1 > button:nth-child(2)").click(); // Select ACME

        // Select currency
        cy.get('#radix-«r7» > form > div:nth-child(3) > div > button').click();
        cy.wait(200);
        cy.get("#radix-«r7» > form > div:nth-child(3) > div > div > div.p-2.border-b > input").type('USD');
        cy.wait(200);
        cy.get("span").contains("United States Dollar ($)").click();

        // Select valid until date
        cy.get('#«rp»-form-item').click();
        cy.wait(50)
        cy.get('[aria-label="Go to the Next Month"]').click();
        cy.wait(50)
        cy.get('[aria-label="Go to the Next Month"]').click();
        cy.wait(50)
        cy.get("#radix-«rq» > div > div > div > table > tbody > tr:nth-child(4) > td:nth-child(5) > button").click();
        cy.get('#«rp»-form-item').click();

        // Set "notes"
        cy.get('[name="notes"]').type('These are some notes');

        // Select Payment Method
        cy.get('#radix-«r7» > form > div:nth-child(6) button').click();
        cy.wait(200);
        cy.get("span").contains("Bank Transfer").click();

        // Add line items
        cy.get('button').contains('Add Item').click();
        cy.get('[name="items.0.description"]').type('Frontend Refactor');
        cy.get("#radix-«r7» > form > div:nth-child(7) > div.space-y-2 > div > div.flex.gap-2.items-center > div:nth-child(2) > button").click();
        cy.wait(200);
        cy.get('div[role="option"]').filter((index, el) => {
            return Cypress.$(el).find('span').text().trim() === 'Service';
        }).click();
        cy.get("#radix-«r7» > form > div:nth-child(7) > div.space-y-2 > div > div.flex.gap-2.items-center > div:nth-child(3) > div > input").type('1', { force: true }); // pcs
        cy.get("#radix-«r7» > form > div:nth-child(7) > div.space-y-2 > div > div.flex.gap-2.items-center > div:nth-child(4) > div > input").type('2200', { force: true }); // price
        cy.get("#radix-«r7» > form > div:nth-child(7) > div.space-y-2 > div > div.flex.gap-2.items-center > div:nth-child(5) > div > input").type('10', { force: true }); // tax

        cy.get('button').contains('Create Quote').click();

        cy.wait(1000);

        cy.contains('2420.00USD'); // Total with tax
        cy.contains('2200.00USD'); // Subtotal without tax
        cy.contains('ACME') // Client name
    });

    it('should create a quote (Jane Doe)', () => {
        cy.get('#root div.flex-row.w-full span.hidden').click();
        cy.get('[name="title"]').type('Quote 2');

        // Select client
        cy.get('#radix-«r7» > form > div:nth-child(2) > div > button').click();
        cy.wait(200);
        cy.get("#radix-«r7» > form > div:nth-child(2) > div > div > div.max-h-60.overflow-auto.p-1.flex.flex-col.gap-1 > button:nth-child(1)").click(); // Select Jane Doe

        // Select currency
        cy.get('#radix-«r7» > form > div:nth-child(3) > div > button').click();
        cy.wait(200);
        cy.get("#radix-«r7» > form > div:nth-child(3) > div > div > div.p-2.border-b > input").type('EUR');
        cy.wait(200);
        cy.get("span").contains("Euro (€)").click();

        // Select valid until date
        const dateButton = cy.get('button').filter((index, el) => {
            return Cypress.$(el).text().trim() === 'Select expiration date';
        })
        dateButton.click();
        cy.wait(50)
        cy.get('[aria-label="Go to the Next Month"]').click();
        cy.wait(50)
        cy.get('[aria-label="Go to the Next Month"]').click();
        cy.wait(50)
        cy.get("* > table > tbody > tr:nth-child(4) > td:nth-child(5) > button").click();
        dateButton.click();

        // Set "notes"
        cy.get('[name="notes"]').type('These are some other notes');

        // Select Payment Method
        cy.get('#radix-«r7» > form > div:nth-child(6) button').click();
        cy.wait(200);
        cy.get("span").contains("PayPal").click();

        // Add line items
        cy.get('button').contains('Add Item').click();
        cy.get('[name="items.0.description"]').type('Backend Development');
        cy.get("#radix-«r7» > form > div:nth-child(7) > div.space-y-2 > div > div.flex.gap-2.items-center > div:nth-child(2) > button").click();
        cy.wait(200);
        cy.get('div[role="option"]').filter((index, el) => {
            return Cypress.$(el).find('span').text().trim() === 'Hour';
        }).click();
        cy.get("#radix-«r7» > form > div:nth-child(7) > div.space-y-2 > div > div.flex.gap-2.items-center > div:nth-child(3) > div > input").type('32', { force: true }); // pcs
        cy.get("#radix-«r7» > form > div:nth-child(7) > div.space-y-2 > div > div.flex.gap-2.items-center > div:nth-child(4) > div > input").type('80', { force: true }); // unit price
        cy.get("#radix-«r7» > form > div:nth-child(7) > div.space-y-2 > div > div.flex.gap-2.items-center > div:nth-child(5) > div > input").type('20', { force: true }); // tax

        cy.get('button').contains('Create Quote').click();

        cy.wait(1000);

        cy.contains('3072.00EUR'); // Total with tax
        cy.contains('2560.00EUR'); // Subtotal without tax
        cy.contains('Jane Doe') // Client name
    });

    it('should send a quote and get the signature link', () => {
        // Envoi du devis
        cy.get('#root > div > section > main > section > section > div > div > div > div > div:nth-child(1) > div > div > button:nth-child(5)').click();
        cy.contains('Quote sent for signature successfully');
        cy.contains('Sent');

        cy.wait(3000);

        // Vérifie l'envoi de l'email
        cy.getLastEmail().then(email => {
            cy.clearEmails();

            cy.wrap(email).should('exist');
            cy.wrap(email.From.Address).should('eq', 'test@local.dev');
            cy.wrap(email.To[0].Address).should('match', /^(john|jane)\.doe@acme\.org$/);
            cy.wrap(email.Subject).should((subject) => {
                expect((subject as unknown as string).startsWith('Please sign document #')).to.be.true;
            });

            const html = email.HTML || '';
            const linkMatch = html.match(/http:\/\/localhost:6284\/signature\/[0-9a-fA-F-]{36}/);
            expect(linkMatch, 'le lien de signature doit exister').to.not.be.null;

            const signatureLink = linkMatch[0];
            cy.wrap(signatureLink).should('include', '/signature/');

            cy.log(`Signature Link: ${signatureLink}`);

            // On passe à la session de signature
            cy.session('signature-session', () => {
                cy.visit(signatureLink);

                // Cliquer sur "Sign"
                cy.get('#root > div > section > main > section > section > div > div.grid.grid-cols-1.lg\\:grid-cols-3.gap-6 > div.space-y-6 > div:nth-child(1) > div.px-6.space-y-4 > button').click();

                cy.wait(3000);

                // Récupérer l'email de confirmation
                cy.getLastEmail().then(confirmationEmail => {
                    cy.clearEmails();

                    cy.wrap(confirmationEmail).should('exist');
                    cy.wrap(confirmationEmail.From.Address).should('eq', 'test@local.dev');
                    cy.wrap(confirmationEmail.To[0].Address).should('match', /^(john|jane)\.doe@acme\.org$/);

                    const confirmationHtml = confirmationEmail.HTML || '';
                    const secureCodeMatch = confirmationHtml.match(/\b\d{4}-\d{4}\b/);
                    expect(secureCodeMatch, 'le code de sécurité doit exister').to.not.be.null;

                    const secureCode = secureCodeMatch[0];
                    cy.wrap(secureCode).should('include', '-');

                    cy.log(`Secure Code: ${secureCode}`);

                    // Entrer le code
                    cy.get('#root > div > section > main > section > section > div > div.grid.grid-cols-1.lg\\:grid-cols-3.gap-6 > div.space-y-6 > div:nth-child(1) > div:nth-child(2) > form > div.space-y-2 > section > div > div:nth-child(4) > input')
                    .type(secureCode.replace('-', ''), { force: true });

                    // Cliquer sur "Sign quote"
                    cy.get('#root > div > section > main > section > section > div > div > div > div:nth-child(1) > div:nth-child(2) > form > div > button')
                    .contains('Sign quote')
                    .click();
                });
            });
        });
    });

    it('should mark the quote as signed', () => {
        cy.get('#root > div > section > main > section > section > div > div > div > div > div:nth-child(1) > div > div > button:nth-child(4)').click();
        cy.contains('Invoice created successfully from quote');
        cy.visit('/invoices');
        cy.get("#root > div > section > main > section > section > div > div:nth-child(4) > div > div > div")
          .children()
          .its('length')
          .should('be.greaterThan', 0);
    });
});
