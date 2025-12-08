beforeEach(() => {
    cy.login();
});

describe('Invoices E2E', () => {
    describe('Create Invoices', () => {
        it('creates a simple invoice', () => {
            cy.visit('/invoices');
            cy.contains('button', /add|new|créer|ajouter/i, { timeout: 10000 }).click();
            cy.wait(500);

            cy.get('[data-cy="invoice-dialog"]', { timeout: 5000 }).should('be.visible');

            cy.get('[data-cy="invoice-client-select"] button').first().click();
            cy.wait(300);
            cy.get('[data-cy="invoice-client-select-options"]').should('be.visible');
            cy.get('[data-cy="invoice-client-select-options"] button').first().click();

            cy.get('[data-cy="invoice-currency-select"] button').first().click();
            cy.wait(200);
            cy.get('[data-cy="invoice-currency-select"] input').type('EUR');
            cy.wait(200);
            cy.get('[data-cy="invoice-currency-select-option-euro-(€)"]').click();

            cy.get('[name="notes"]').type('Payment due within 30 days');

            cy.contains('button', /Add Item|Ajouter/i).click();
            cy.get('[name="items.0.description"]').type('Consulting Services');
            cy.get('[name="items.0.quantity"]').clear().type('10');
            cy.get('[name="items.0.unitPrice"]').clear().type('150');
            cy.get('[name="items.0.vatRate"]').clear().type('20');

            cy.get('[data-cy="invoice-submit"]').click();

            cy.get('[data-cy="invoice-dialog"]').should('not.exist');
            cy.contains('Consulting Services', { timeout: 10000 });
        });

        it('creates an invoice with multiple items', () => {
            cy.visit('/invoices');
            cy.contains('button', /add|new|créer|ajouter/i, { timeout: 10000 }).click();
            cy.wait(500);

            cy.get('[data-cy="invoice-dialog"]', { timeout: 5000 }).should('be.visible');

            cy.get('[data-cy="invoice-client-select"] button').first().click();
            cy.wait(300);
            cy.get('[data-cy="invoice-client-select-options"]').should('be.visible');
            cy.get('[data-cy="invoice-client-select-options"] button').first().click();

            cy.contains('button', /Add Item|Ajouter/i).click();
            cy.get('[name="items.0.description"]').type('Design Work');
            cy.get('[name="items.0.quantity"]').clear().type('20');
            cy.get('[name="items.0.unitPrice"]').clear().type('75');
            cy.get('[name="items.0.vatRate"]').clear().type('20');

            cy.contains('button', /Add Item|Ajouter/i).click();
            cy.get('[name="items.1.description"]').type('Development Work');
            cy.get('[name="items.1.quantity"]').clear().type('40');
            cy.get('[name="items.1.unitPrice"]').clear().type('100');
            cy.get('[name="items.1.vatRate"]').clear().type('20');

            cy.get('[data-cy="invoice-submit"]').click();

            cy.get('[data-cy="invoice-dialog"]').should('not.exist');
            cy.contains('Design Work', { timeout: 10000 });
        });
    });

    describe('Validation Errors', () => {
        it('shows error when no client is selected', () => {
            cy.visit('/invoices');
            cy.contains('button', /add|new|créer|ajouter/i, { timeout: 10000 }).click();
            cy.wait(500);

            cy.get('[data-cy="invoice-dialog"]', { timeout: 5000 }).should('be.visible');

            cy.contains('button', /Add Item|Ajouter/i).click();
            cy.get('[name="items.0.description"]').type('Test Item');
            cy.get('[name="items.0.quantity"]').clear().type('1');
            cy.get('[name="items.0.unitPrice"]').clear().type('100');
            cy.get('[name="items.0.vatRate"]').clear().type('0');

            cy.get('[data-cy="invoice-submit"]').click();
            cy.get('[data-cy="invoice-dialog"]').should('be.visible');
            cy.contains(/client|required|requis/i);
        });

        it('shows error for empty item description', () => {
            cy.visit('/invoices');
            cy.contains('button', /add|new|créer|ajouter/i, { timeout: 10000 }).click();
            cy.wait(500);

            cy.get('[data-cy="invoice-dialog"]', { timeout: 5000 }).should('be.visible');

            cy.get('[data-cy="invoice-client-select"] button').first().click();
            cy.wait(300);
            cy.get('[data-cy="invoice-client-select-options"]').should('be.visible');
            cy.get('[data-cy="invoice-client-select-options"] button').first().click();

            cy.contains('button', /Add Item|Ajouter/i).click();
            cy.get('[name="items.0.description"]').clear();
            cy.get('[name="items.0.quantity"]').clear().type('1');
            cy.get('[name="items.0.unitPrice"]').clear().type('100');

            cy.get('[data-cy="invoice-submit"]').click();
            cy.get('[data-cy="invoice-dialog"]').should('be.visible');
            cy.contains(/description|required|requis/i);
        });

        it('shows error for zero quantity', () => {
            cy.visit('/invoices');
            cy.contains('button', /add|new|créer|ajouter/i, { timeout: 10000 }).click();
            cy.wait(500);

            cy.get('[data-cy="invoice-dialog"]', { timeout: 5000 }).should('be.visible');

            cy.get('[data-cy="invoice-client-select"] button').first().click();
            cy.wait(300);
            cy.get('[data-cy="invoice-client-select-options"]').should('be.visible');
            cy.get('[data-cy="invoice-client-select-options"] button').first().click();

            cy.contains('button', /Add Item|Ajouter/i).click();
            cy.get('[name="items.0.description"]').type('Test Item');
            cy.get('[name="items.0.quantity"]').clear().type('0');
            cy.get('[name="items.0.unitPrice"]').clear().type('100');

            cy.get('[data-cy="invoice-submit"]').click();
            cy.get('[data-cy="invoice-dialog"]').should('be.visible');
            cy.contains(/quantity|min|least|minimum/i);
        });
    });

    describe('Edge Cases', () => {
        it('handles zero VAT rate', () => {
            cy.visit('/invoices');
            cy.contains('button', /add|new|créer|ajouter/i, { timeout: 10000 }).click();
            cy.wait(500);

            cy.get('[data-cy="invoice-dialog"]', { timeout: 5000 }).should('be.visible');

            cy.get('[data-cy="invoice-client-select"] button').first().click();
            cy.wait(300);
            cy.get('[data-cy="invoice-client-select-options"]').should('be.visible');
            cy.get('[data-cy="invoice-client-select-options"] button').first().click();

            cy.contains('button', /Add Item|Ajouter/i).click();
            cy.get('[name="items.0.description"]').type('Zero VAT Service');
            cy.get('[name="items.0.quantity"]').clear().type('1');
            cy.get('[name="items.0.unitPrice"]').clear().type('1000');
            cy.get('[name="items.0.vatRate"]').clear().type('0');

            cy.get('[data-cy="invoice-submit"]').click();

            cy.get('[data-cy="invoice-dialog"]').should('not.exist');
            cy.contains('Zero VAT Service', { timeout: 10000 });
        });

        it('handles decimal prices', () => {
            cy.visit('/invoices');
            cy.contains('button', /add|new|créer|ajouter/i, { timeout: 10000 }).click();
            cy.wait(500);

            cy.get('[data-cy="invoice-dialog"]', { timeout: 5000 }).should('be.visible');

            cy.get('[data-cy="invoice-client-select"] button').first().click();
            cy.wait(300);
            cy.get('[data-cy="invoice-client-select-options"]').should('be.visible');
            cy.get('[data-cy="invoice-client-select-options"] button').first().click();

            cy.contains('button', /Add Item|Ajouter/i).click();
            cy.get('[name="items.0.description"]').type('Decimal Price Service');
            cy.get('[name="items.0.quantity"]').clear().type('3');
            cy.get('[name="items.0.unitPrice"]').clear().type('99.99');
            cy.get('[name="items.0.vatRate"]').clear().type('5.5');

            cy.get('[data-cy="invoice-submit"]').click();

            cy.get('[data-cy="invoice-dialog"]').should('not.exist');
            cy.contains('Decimal Price Service', { timeout: 10000 });
        });

        it('handles special characters', () => {
            cy.visit('/invoices');
            cy.contains('button', /add|new|créer|ajouter/i, { timeout: 10000 }).click();
            cy.wait(500);

            cy.get('[data-cy="invoice-dialog"]', { timeout: 5000 }).should('be.visible');

            cy.get('[data-cy="invoice-client-select"] button').first().click();
            cy.wait(300);
            cy.get('[data-cy="invoice-client-select-options"]').should('be.visible');
            cy.get('[data-cy="invoice-client-select-options"] button').first().click();

            cy.contains('button', /Add Item|Ajouter/i).click();
            cy.get('[name="items.0.description"]').type("Service spécial <test> & 'quotes'");
            cy.get('[name="items.0.quantity"]').clear().type('1');
            cy.get('[name="items.0.unitPrice"]').clear().type('500');
            cy.get('[name="items.0.vatRate"]').clear().type('20');

            cy.get('[data-cy="invoice-submit"]').click();

            cy.get('[data-cy="invoice-dialog"]').should('not.exist');
            cy.contains('Service spécial', { timeout: 10000 });
        });
    });

    describe('Invoice View', () => {
        it('views an invoice', () => {
            cy.visit('/invoices');
            cy.wait(2000);

            cy.contains('Consulting Services', { timeout: 5000 }).should('be.visible');
            cy.contains('Consulting Services').parent().parent().within(() => {
                cy.get('button').first().click();
            });

            cy.get('[role="dialog"]').should('be.visible');
            cy.contains('Consulting Services');
        });
    });

    describe('Edit Invoices', () => {
        it('edits an existing invoice', () => {
            cy.visit('/invoices');
            cy.wait(2000);

            cy.contains('Zero VAT Service', { timeout: 5000 }).should('be.visible');
            cy.contains('Zero VAT Service').parent().parent().within(() => {
                cy.get('button').eq(3).click();
            });

            cy.get('[data-cy="invoice-dialog"]', { timeout: 5000 }).should('be.visible');
            cy.get('[name="notes"]').clear().type('Updated payment terms: Net 15');
            cy.get('[data-cy="invoice-submit"]').click();

            cy.get('[data-cy="invoice-dialog"]').should('not.exist');
            cy.wait(2000);
        });
    });

    describe('Delete Invoices', () => {
        it('deletes an invoice', () => {
            cy.visit('/invoices');
            cy.wait(2000);

            cy.contains('Decimal Price Service', { timeout: 5000 }).should('be.visible');
            cy.contains('Decimal Price Service').parent().parent().within(() => {
                cy.get('button').last().click();
            });

            cy.get('[role="alertdialog"], [role="dialog"]').within(() => {
                cy.contains('button', /delete|confirm|supprimer|confirmer/i).click();
            });

            cy.wait(2000);
            cy.contains('Decimal Price Service').should('not.exist');
        });
    });
});
