beforeEach(() => {
    cy.login();
    cy.visit('/quotes');
});

describe('Quotes E2E', () => {
    it('should create a quote (ACME)', () => {
        // Click on "Add New Quote" button
        cy.contains('button', 'Add New Quote').click({ force: true });
        cy.wait(500);

        // Fill in title
        cy.get('[name="title"]').type('Quote 1');

        // Select client - click on the client dropdown button
        cy.get('[data-cy="quote-client-select"] button').first().click();
        cy.wait(200);
        // Select ACME from the dropdown
        cy.get('[data-cy="quote-client-select-option-acme"]').click();

        // Select currency - click on the currency dropdown
        cy.contains('label', 'Currency').parent().find('button').first().click();
        cy.wait(200);
        cy.get('input[placeholder="Search currencies..."]').type('USD');
        cy.wait(200);
        cy.get('span').contains('United States Dollar ($)').click();

        // Select valid until date - click on the date picker button
        cy.contains('button', 'Select expiration date').click();
        cy.wait(100);
        cy.get('[aria-label="Go to the Next Month"]').click();
        cy.wait(50);
        cy.get('[aria-label="Go to the Next Month"]').click();
        cy.wait(50);
        // Select a day in the calendar
        cy.get('table tbody tr:nth-child(3) td:nth-child(4) button').click();
        // Close the calendar by pressing Escape
        cy.get('body').type('{esc}');
        cy.wait(100);

        // Set "notes"
        cy.get('[name="notes"]').type('These are some notes');

        // Select Payment Method
        cy.contains('label', 'Payment Method').parent().find('button[role="combobox"]').click();
        cy.wait(200);
        cy.get('[role="option"]').contains('Bank Transfer').click();

        // Add line items
        cy.contains('button', 'Add Item').click();
        cy.get('[name="items.0.description"]').type('Frontend Refactor');

        // Select item type
        cy.get('[aria-label="Type"]').first().click();
        cy.wait(200);
        cy.get('[role="option"]').contains('Service').click();

        // Fill quantity, price and tax
        cy.get('[name="items.0.quantity"]').type('1', { force: true });
        cy.get('[name="items.0.unitPrice"]').type('2200', { force: true });
        cy.get('[name="items.0.vatRate"]').type('10', { force: true });

        // Submit the form
        cy.get('[data-cy="quote-submit"]').click();

        cy.wait(1000);

        // Verify the quote was created
        cy.contains('2420.00USD'); // Total with tax
        cy.contains('2200.00USD'); // Subtotal without tax
        cy.contains('ACME'); // Client name
    });

    it('should create a quote (Jane Doe)', () => {
        // Click on "Add New Quote" button
        cy.contains('button', 'Add New Quote').click({ force: true });
        cy.wait(500);

        // Fill in title
        cy.get('[name="title"]').type('Quote 2');

        // Select client - click on the client dropdown button
        cy.get('[data-cy="quote-client-select"] button').first().click();
        cy.wait(200);
        // Select Jane Doe from the dropdown
        cy.get('[data-cy="quote-client-select-option-jane-doe"]').click();

        // Select currency
        cy.contains('label', 'Currency').parent().find('button').first().click();
        cy.wait(200);
        cy.get('input[placeholder="Search currencies..."]').type('EUR');
        cy.wait(200);
        cy.get('span').contains('Euro (€)').click();

        // Select valid until date
        cy.contains('button', 'Select expiration date').click();
        cy.wait(100);
        cy.get('[aria-label="Go to the Next Month"]').click();
        cy.wait(50);
        cy.get('[aria-label="Go to the Next Month"]').click();
        cy.wait(50);
        cy.get('table tbody tr:nth-child(3) td:nth-child(4) button').click();
        // Close the calendar by pressing Escape
        cy.get('body').type('{esc}');
        cy.wait(100);

        // Set "notes"
        cy.get('[name="notes"]').type('These are some notes');

        // Select Payment Method
        cy.contains('label', 'Payment Method').parent().find('button[role="combobox"]').click();
        cy.wait(200);
        cy.get('[role="option"]').contains('PayPal').click();

        // Add line items
        cy.contains('button', 'Add Item').click();
        cy.get('[name="items.0.description"]').type('Backend Development');

        // Select item type
        cy.get('[aria-label="Type"]').first().click();
        cy.wait(200);
        cy.get('[role="option"]').contains('Hour').click();

        // Fill quantity, price and tax
        cy.get('[name="items.0.quantity"]').type('32', { force: true });
        cy.get('[name="items.0.unitPrice"]').type('80', { force: true });
        cy.get('[name="items.0.vatRate"]').type('20', { force: true });

        // Submit the form
        cy.get('[data-cy="quote-submit"]').click();

        cy.wait(1000);

        cy.contains('3072.00EUR'); // Total with tax
        cy.contains('2560.00EUR'); // Subtotal without tax
        cy.contains('Jane Doe'); // Client name
    });
});
