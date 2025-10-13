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

        const date = new Date();
        const formatedDate = ("0" + date.getDate()).slice(-2) + '/' + ("0" + (date.getMonth() + 1)).slice(-2) + '/' + date.getFullYear();
        cy.contains(formatedDate);
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
        cy.get('#«rp»-form-item').click();
        cy.wait(50)
        cy.get('[aria-label="Go to the Next Month"]').click();
        cy.wait(50)
        cy.get('[aria-label="Go to the Next Month"]').click();
        cy.wait(50)
        cy.get("#radix-«rq» > div > div > div > table > tbody > tr:nth-child(4) > td:nth-child(5) > button").click();
        cy.get('#«rp»-form-item').click();

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

        const date = new Date();
        const formatedDate = ("0" + date.getDate()).slice(-2) + '/' + ("0" + (date.getMonth() + 1)).slice(-2) + '/' + date.getFullYear();
        cy.contains(formatedDate);
    });
})