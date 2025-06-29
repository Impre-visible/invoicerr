export const lightTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: "Segoe UI", "Helvetica Neue", sans-serif;
      margin: 2.5cm;
      color: #333;
      font-size: 14px;
    }

    h1 {
      text-align: right;
      font-size: 24px;
      color: #1a1a1a;
      margin-bottom: 0;
    }

    p.date {
      text-align: right;
      font-size: 13px;
      color: #666;
      margin-top: 4px;
    }

    .flex {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
    }

    .info-block {
      width: 48%;
      line-height: 1.5;
      font-size: 13px;
    }

    .info-block strong {
      font-size: 15px;
      display: block;
      margin-bottom: 5px;
      color: #111;
    }

    .section-title {
      font-weight: 600;
      font-size: 15px;
      margin-top: 40px;
      margin-bottom: 12px;
      border-bottom: 2px solid #444;
      padding-bottom: 4px;
      color: #222;
    }

    .due-date {
      margin-top: 25px;
      font-weight: 600;
      font-size: 14px;
    }

    table.items {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      font-size: 13px;
    }

    table.items thead {
      background-color: #f0f0f0;
    }

    table.items th, table.items td {
      border: 1px solid #ccc;
      padding: 10px;
      text-align: left;
    }

    table.items th {
      background-color: #fafafa;
      font-weight: 600;
    }

    table.items td.numeric {
      text-align: right;
      white-space: nowrap;
    }

    .total {
      margin-top: 30px;
      font-weight: 600;
      font-size: 14px;
    }

    .total p {
      margin: 4px 0;
    }

    .notes {
      margin-top: 40px;
      font-style: italic;
      color: #555;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <h1>Invoice #{{number}}</h1>
  <p class="date">Date: {{date}}</p>

  <div class="flex">
    <div class="info-block">
      <strong>From:</strong>
      {{company.name}}<br />
      {{company.description}}<br />
      Legal ID: {{company.legalId}}<br />
      VAT: {{company.VAT}}<br />
      Founded: {{company.foundedAt}}<br />
      {{company.address}}<br />
      {{company.postalCode}} {{company.city}}<br />
      {{company.country}}<br />
      {{company.email}}<br />
      {{company.phone}}
    </div>

    <div class="info-block">
      <strong>Bill To:</strong>
      {{client.name}}<br />
      {{client.description}}<br />
      Legal ID: {{client.legalId}}<br />
      VAT: {{client.VAT}}<br />
      Founded: {{client.foundedAt}}<br />
      {{client.address}}<br />
      {{client.postalCode}} {{client.city}}<br />
      {{client.country}}<br />
      {{client.email}}<br />
      {{client.phone}}
    </div>
  </div>

  <p class="due-date">Due Date: {{dueDate}}</p>

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
  <div class="notes">
    <p>{{notes}}</p>
  </div>
  {{/if}}
</body>
</html>
`;
