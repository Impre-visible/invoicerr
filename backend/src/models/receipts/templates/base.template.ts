export const baseTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{labels.receipt}} {{number}}</title>
  <style>
    body { font-family: {{fontFamily}}, sans-serif; margin: {{padding}}px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .company-info h1 { margin: 0; color: {{primaryColor}}; }
    .receipt-info { text-align: right; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    .total-row { font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      {{#if includeLogo}}<img src="{{logoB64}}" style="max-height:60px"><br>{{/if}}
      <h1>{{company.name}}</h1>
      <p>{{company.address}}<br>{{company.city}} {{company.postalCode}}<br>{{company.country}}<br>
      {{company.email}} • {{company.phone}}<br>
      {{#if company.legalId}}{{labels.legalId}}: {{company.legalId}}<br>{{/if}}
      {{#if company.VAT}}{{labels.VATId}}: {{company.VAT}}{{/if}}</p>
    </div>
    <div class="receipt-info">
      <h2>{{labels.receipt}}</h2>
      <p><strong>{{labels.receiptNumber}}</strong> {{number}}<br>
      <strong>{{labels.paymentDate}}</strong> {{paymentDate}}</p>
    </div>
  </div>

  <p><strong>{{labels.receivedFrom}}</strong><br>
  {{client.name}}<br>
  {{client.address}}<br>
  {{client.city}} {{client.postalCode}}<br>
  {{client.country}}</p>

  <p><strong>{{labels.invoiceRefer}}</strong> {{invoiceNumber}}</p>

  <table>
    <thead><tr><th>{{labels.description}}</th><th>{{labels.totalReceived}}</th></tr></thead>
    <tbody>
    {{#each items}}
      <tr>
        <td>{{description}}</td>
        <td>{{currency}} {{amount}}</td>
      </tr>
    {{/each}}
    </tbody>
  </table>

  <p><strong>{{labels.totalReceived}}</strong> {{currency}} {{amount}}</p>
  <p><strong>{{labels.paymentMethod}}</strong> {{paymentMethod}}</p>
</body>
</html>
`;
