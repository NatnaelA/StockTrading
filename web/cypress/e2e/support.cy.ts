describe('Support Ticket System', () => {
  beforeEach(() => {
    // Mock Firebase Auth
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'user',
      }));
    });

    cy.intercept('GET', '/api/tickets*', {
      statusCode: 200,
      body: [{
        id: 'existing-ticket',
        subject: 'Existing Test Ticket',
        category: 'technical',
        status: 'open',
        priority: 'high',
        createdAt: new Date().toISOString(),
      }],
    }).as('getTickets');

    cy.intercept('POST', '/api/tickets', {
      statusCode: 201,
      body: {
        id: 'new-ticket',
        status: 'open',
      },
    }).as('createTicket');

    cy.visit('/support');
  });

  it('displays existing tickets and creates new ones', () => {
    // Verify existing ticket is displayed
    cy.wait('@getTickets');
    cy.contains('Existing Test Ticket').should('be.visible');

    // Open new ticket form
    cy.contains('button', 'Create New Ticket').click();

    // Fill out the form
    cy.get('select[name="category"]').select('technical');
    cy.get('input[name="subject"]').type('E2E Test Ticket');
    cy.get('textarea[name="description"]').type('This is an E2E test ticket');
    cy.get('select[name="priority"]').select('high');

    // Submit the form
    cy.contains('button', 'Submit Ticket').click();

    // Verify submission
    cy.wait('@createTicket').its('request.body').should('deep.include', {
      category: 'technical',
      subject: 'E2E Test Ticket',
      description: 'This is an E2E test ticket',
      priority: 'high',
    });

    // Verify success message
    cy.contains('Ticket Created Successfully').should('be.visible');
  });

  it('filters tickets', () => {
    cy.wait('@getTickets');

    // Open filters
    cy.contains('button', 'Filters').click();

    // Apply status filter
    cy.get('select[aria-label="Status"]').select('open');

    // Verify filter request
    cy.wait('@getTickets').its('request.url').should('include', 'status=open');
  });

  it('handles errors gracefully', () => {
    // Mock error response
    cy.intercept('GET', '/api/tickets*', {
      statusCode: 500,
      body: { error: 'Internal Server Error' },
    }).as('getTicketsError');

    cy.visit('/support');
    cy.wait('@getTicketsError');

    // Verify error message
    cy.contains('An error occurred').should('be.visible');
  });

  it('validates form inputs', () => {
    // Open new ticket form
    cy.contains('button', 'Create New Ticket').click();

    // Try to submit without required fields
    cy.contains('button', 'Submit Ticket').click();

    // Verify validation messages
    cy.get('input[name="subject"]:invalid').should('exist');
    cy.get('textarea[name="description"]:invalid').should('exist');

    // Fill required fields
    cy.get('input[name="subject"]').type('Valid Subject');
    cy.get('textarea[name="description"]').type('Valid Description');

    // Verify form becomes valid
    cy.get('form').then($form => {
      expect($form[0].checkValidity()).to.be.true;
    });
  });
}); 