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
  <h1>Invoice #{{number}}</h1>
  <p class="date">Date: {{date}}</p>

  <div class="info">
    <strong>From:</strong><br />
    {{company.name}}<br />
    {{company.address}}<br />
    {{company.city}} {{company.postalCode}}<br />
    {{company.country}}<br />
    {{company.email}}<br />
    {{company.phone}}
  </div>

  <div class="info">
    <strong>Bill To:</strong><br />
    {{client.name}}<br />
    {{client.address}}<br />
    {{client.city}} {{client.postalCode}}<br />
    {{client.country}}<br />
    {{client.email}}<br />
    {{client.phone}}
  </div>

  <p><strong>Due Date:</strong> {{dueDate}}</p>

  <div class="section-title">Items:</div>
  <table class="items">
    <thead>
      <tr>
        <th>Description</th>
        <th>Quantity</th>
        <th>Unit Price ({{currency}})</th>
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
    <p>Subtotal (HT): {{totalHT}} {{currency}}</p>
    <p>VAT: {{totalVAT}} {{currency}}</p>
    <p>Total Due (TTC): {{totalTTC}} {{currency}}</p>
  </div>

  {{#if notes}}
  <div class="section-title">Notes:</div>
  <p>{{notes}}</p>
  {{/if}}

</body>
</html>
`;
