import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Handlebars from "handlebars"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

type TemplateType = "invoice" | "quote"

const mockInvoiceData = {
    number: "INV-2024-001",
    date: "2024-01-15",
    dueDate: "2024-02-15",
    currency: "USD",
    notes: "Thank you for your business. Payment is due within 30 days.",
    company: {
        name: "Acme Corporation",
        email: "billing@acme.com",
        address: "123 Business St, Suite 100",
        city: "New York",
        state: "NY",
        zip: "10001",
        phone: "+1 (555) 123-4567",
    },
    client: {
        name: "John Smith",
        email: "john@example.com",
        address: "456 Client Ave",
        city: "Los Angeles",
        state: "CA",
        zip: "90210",
        phone: "+1 (555) 987-6543",
    },
    items: [
        {
            description: "Web Development Services",
            quantity: 40,
            unitPrice: 125.0,
            vatRate: 0.2,
            totalPrice: 5000.0,
        },
        {
            description: "UI/UX Design",
            quantity: 20,
            unitPrice: 100.0,
            vatRate: 0.2,
            totalPrice: 2000.0,
        },
        {
            description: "Project Management",
            quantity: 10,
            unitPrice: 150.0,
            vatRate: 0.2,
            totalPrice: 1500.0,
        },
    ],
    totalHT: 8500.0,
    totalVAT: 1700.0,
    totalTTC: 10200.0,
}

const mockQuoteData = {
    ...mockInvoiceData,
    number: "QUO-2024-001",
    validUntil: "2024-02-15",
    notes: "This quote is valid for 30 days. Please contact us if you have any questions.",
}

const defaultInvoiceTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{number}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .company-info h1 { margin: 0; color: #2563eb; }
        .invoice-info { text-align: right; }
        .client-info { margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .total-row { font-weight: bold; background-color: #f8f9fa; }
        .notes { margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            <h1>{{company.name}}</h1>
            <p>{{company.address}}<br>
            {{company.city}}, {{company.state}} {{company.zip}}<br>
            {{company.email}} | {{company.phone}}</p>
        </div>
        <div class="invoice-info">
            <h2>INVOICE</h2>
            <p><strong>Invoice #:</strong> {{number}}<br>
            <strong>Date:</strong> {{date}}<br>
            <strong>Due Date:</strong> {{dueDate}}</p>
        </div>
    </div>

    <div class="client-info">
        <h3>Bill To:</h3>
        <p>{{client.name}}<br>
        {{client.address}}<br>
        {{client.city}}, {{client.state}} {{client.zip}}<br>
        {{client.email}}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>VAT Rate</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            {{#each items}}
            <tr>
                <td>{{description}}</td>
                <td>{{quantity}}</td>
                <td>{{currency}} {{unitPrice}}</td>
                <td>{{vatRate}}%</td>
                <td>{{currency}} {{totalPrice}}</td>
            </tr>
            {{/each}}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="4"><strong>Subtotal (HT):</strong></td>
                <td><strong>{{currency}} {{totalHT}}</strong></td>
            </tr>
            <tr>
                <td colspan="4"><strong>VAT:</strong></td>
                <td><strong>{{currency}} {{totalVAT}}</strong></td>
            </tr>
            <tr class="total-row">
                <td colspan="4"><strong>Total (TTC):</strong></td>
                <td><strong>{{currency}} {{totalTTC}}</strong></td>
            </tr>
        </tfoot>
    </table>

    <div class="notes">
        <h4>Notes:</h4>
        <p>{{notes}}</p>
    </div>
</body>
</html>`

const defaultQuoteTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quote {{number}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .company-info h1 { margin: 0; color: #16a34a; }
        .quote-info { text-align: right; }
        .client-info { margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f0fdf4; font-weight: bold; }
        .total-row { font-weight: bold; background-color: #f0fdf4; }
        .notes { margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 4px; }
        .validity { color: #dc2626; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            <h1>{{company.name}}</h1>
            <p>{{company.address}}<br>
            {{company.city}}, {{company.state}} {{company.zip}}<br>
            {{company.email}} | {{company.phone}}</p>
        </div>
        <div class="quote-info">
            <h2>QUOTE</h2>
            <p><strong>Quote #:</strong> {{number}}<br>
            <strong>Date:</strong> {{date}}<br>
            <strong class="validity">Valid Until:</strong> {{validUntil}}</p>
        </div>
    </div>

    <div class="client-info">
        <h3>Quote For:</h3>
        <p>{{client.name}}<br>
        {{client.address}}<br>
        {{client.city}}, {{client.state}} {{client.zip}}<br>
        {{client.email}}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>VAT Rate</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            {{#each items}}
            <tr>
                <td>{{description}}</td>
                <td>{{quantity}}</td>
                <td>{{currency}} {{unitPrice}}</td>
                <td>{{vatRate}}%</td>
                <td>{{currency}} {{totalPrice}}</td>
            </tr>
            {{/each}}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="4"><strong>Subtotal (HT):</strong></td>
                <td><strong>{{currency}} {{totalHT}}</strong></td>
            </tr>
            <tr>
                <td colspan="4"><strong>VAT:</strong></td>
                <td><strong>{{currency}} {{totalVAT}}</strong></td>
            </tr>
            <tr class="total-row">
                <td colspan="4"><strong>Total (TTC):</strong></td>
                <td><strong>{{currency}} {{totalTTC}}</strong></td>
            </tr>
        </tfoot>
    </table>

    <div class="notes">
        <h4>Notes:</h4>
        <p>{{notes}}</p>
    </div>
</body>
</html>`

export default function PDFTemplatesSettings() {
    const [templateType, setTemplateType] = useState<TemplateType>("invoice")
    const [code, setCode] = useState(defaultInvoiceTemplate)
    const [preview, setPreview] = useState("")

    const getCurrentMockData = () => {
        return templateType === "invoice" ? mockInvoiceData : mockQuoteData
    }

    const renderTemplate = (templateCode: string) => {
        try {
            const template = Handlebars.compile(templateCode)
            const mockData = getCurrentMockData()
            return template(mockData)
        } catch (error) {
            return `<div style="color: red; padding: 20px; font-family: monospace;">
        <h3>Template Error:</h3>
        <pre>${error instanceof Error ? error.message : "Unknown error"}</pre>
      </div>`
        }
    }

    useEffect(() => {
        const newTemplate = templateType === "invoice" ? defaultInvoiceTemplate : defaultQuoteTemplate
        setCode(newTemplate)
    }, [templateType])

    useEffect(() => {
        const rendered = renderTemplate(code)
        setPreview(rendered)
    }, [code, templateType])

    const availableVariables =
        templateType === "invoice"
            ? [
                "{{number}}",
                "{{date}}",
                "{{dueDate}}",
                "{{currency}}",
                "{{notes}}",
                "{{company.name}}",
                "{{company.email}}",
                "{{company.address}}",
                "{{client.name}}",
                "{{client.email}}",
                "{{client.address}}",
                "{{#each items}}",
                "{{description}}",
                "{{quantity}}",
                "{{unitPrice}}",
                "{{vatRate}}",
                "{{totalPrice}}",
                "{{/each}}",
                "{{totalHT}}",
                "{{totalVAT}}",
                "{{totalTTC}}",
            ]
            : [
                "{{number}}",
                "{{date}}",
                "{{validUntil}}",
                "{{currency}}",
                "{{notes}}",
                "{{company.name}}",
                "{{company.email}}",
                "{{company.address}}",
                "{{client.name}}",
                "{{client.email}}",
                "{{client.address}}",
                "{{#each items}}",
                "{{description}}",
                "{{quantity}}",
                "{{unitPrice}}",
                "{{vatRate}}",
                "{{totalPrice}}",
                "{{/each}}",
                "{{totalHT}}",
                "{{totalVAT}}",
                "{{totalTTC}}",
            ]

    return (
        <div className="h-screen flex flex-col bg-background">
            <div className="p-6 border-b bg-card">
                <div className="mb-4">
                    <h1 className="text-3xl font-bold">PDF Template Settings</h1>
                    <p className="text-muted-foreground">Manage your PDF templates for invoices and quotes.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="template-type" className="text-sm font-medium">
                            Template Type:
                        </label>
                        <Select value={templateType} onValueChange={(value: TemplateType) => setTemplateType(value)}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="invoice">Invoice</SelectItem>
                                <SelectItem value="quote">Quote</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button variant="outline" size="sm">
                        Save Template
                    </Button>

                    <Button variant="outline" size="sm">
                        Reset to Default
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Editor Panel */}
                <div className="w-1/2 flex flex-col border-r bg-card">
                    <div className="p-4 border-b bg-muted/50">
                        <h3 className="font-semibold mb-2">Template Editor</h3>
                        <div className="flex flex-wrap gap-1 mb-3">
                            {availableVariables.slice(0, 8).map((variable) => (
                                <Badge key={variable} variant="secondary" className="text-xs font-mono">
                                    {variable}
                                </Badge>
                            ))}
                            <Badge variant="outline" className="text-xs">
                                +{availableVariables.length - 8} more
                            </Badge>
                        </div>
                        <Separator />
                    </div>

                    <div className="flex-1 p-4">
                        <Textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full h-full resize-none font-mono text-sm leading-relaxed max-h-0"
                            placeholder="Enter your Handlebars template here..."
                            style={{ minHeight: "100%" }}
                        />
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="w-1/2 flex flex-col bg-muted/20">
                    <div className="p-4 border-b bg-muted/50">
                        <h3 className="font-semibold">Live Preview</h3>
                        <p className="text-sm text-muted-foreground">Preview updates automatically with mock data</p>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <div className="p-4 h-full">
                            <Card className="bg-white h-full py-0">
                                <CardContent className="p-0 h-full">
                                    <iframe
                                        ref={(iframe) => {
                                            if (iframe) {
                                                const doc = iframe.contentDocument || iframe.contentWindow?.document
                                                if (doc) {
                                                    doc.open()
                                                    doc.write(preview)
                                                    doc.close()
                                                }
                                            }
                                        }}
                                        className="w-full h-full border-0"
                                        title="PDF Template Preview"
                                        sandbox="allow-same-origin"
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Variables Reference */}
            <div className="border-t bg-card p-4">
                <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                        Available Variables ({availableVariables.length})
                    </summary>
                    <div className="mt-2 flex flex-wrap gap-1">
                        {availableVariables.map((variable) => (
                            <Badge
                                key={variable}
                                variant="outline"
                                className="text-xs font-mono cursor-pointer hover:bg-muted"
                                onClick={() => {
                                    const textarea = document.querySelector("textarea")
                                    if (textarea) {
                                        const start = textarea.selectionStart
                                        const end = textarea.selectionEnd
                                        const newValue = code.substring(0, start) + variable + code.substring(end)
                                        setCode(newValue)
                                        setTimeout(() => {
                                            textarea.focus()
                                            textarea.setSelectionRange(start + variable.length, start + variable.length)
                                        }, 0)
                                    }
                                }}
                            >
                                {variable}
                            </Badge>
                        ))}
                    </div>
                </details>
            </div>
        </div>
    )
}
