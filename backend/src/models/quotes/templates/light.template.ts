export const lightTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 2cm;
      color: #333;
    }
    h1 {
      text-align: right;
      margin-bottom: 0;
      font-weight: 700;
    }
    p.date {
      text-align: right;
      margin-top: 4px;
      color: #666;
      font-size: 0.9em;
    }
    .info {
      margin-top: 20px;
      line-height: 1.4;
    }
    .section-title {
      margin-top: 40px;
      margin-bottom: 10px;
      font-weight: 600;
      font-size: 1.1em;
      border-bottom: 2px solid #444;
      padding-bottom: 4px;
    }
    table.items {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      font-size: 0.95em;
    }
    table.items thead {
      background-color: #f5f5f5;
    }
    table.items th, table.items td {
      border: 1px solid #ccc;
      padding: 8px 12px;
      text-align: left;
    }
    table.items th {
      font-weight: 700;
    }
    table.items td.numeric {
      text-align: right;
      white-space: nowrap;
    }
    .total {
      margin-top: 30px;
      font-weight: 700;
      font-size: 1em;
    }
    .total p {
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <h1>Quote #{{number}}</h1>
  <p class="date">Date: {{date}}</p>

  <div class="info">
    <strong>From:</strong><br />
    {{company.name}}<br />
    {{company.address}}, {{company.city}} {{company.postalCode}} {{company.country}}
  </div>

  <div class="info">
    <strong>To:</strong><br />
    {{client.name}}<br />
    {{client.address}}, {{client.city}} {{client.postalCode}} {{client.country}}
  </div>

  <p><strong>Valid Until:</strong> {{validUntil}}</p>

  <div class="section-title">Items:</div>
  <table class="items">
    <thead>
      <tr>
        <th>Description</th>
        <th>Quantity</th>
        <th>Unit Price (€)</th>
        <th>VAT Rate (%)</th>
        <th>Total ({{currency}})</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{description}}</td>
        <td class="numeric">{{quantity}}</td>
        <td class="numeric">{{unitPrice}}</td>
        <td class="numeric">{{vatRate}}</td>
        <td class="numeric">{{totalPrice}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <div class="total">
    <p>Total HT: {{totalHT}} {{currency}}</p>
    <p>Total VAT: {{totalVAT}} {{currency}}</p>
    <p>Total TTC: {{totalTTC}} {{currency}}</p>
  </div>
</body>
</html>
`;
