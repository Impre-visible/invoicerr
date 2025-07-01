import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import type { Invoice } from "@/types"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"

interface InvoiceViewDialogProps {
    invoice: Invoice | null
    onOpenChange: (open: boolean) => void
}

export function InvoiceViewDialog({ invoice, onOpenChange }: InvoiceViewDialogProps) {
    const { t } = useTranslation()

    if (!invoice) return null

    const formatDate = (date?: string) => (date ? format(new Date(date), "PPP") : "—")

    const getStatusLabel = (status: string) => {
        return t(`invoices.view.status.${status.toLowerCase()}`)
    }

    return (
        <Dialog open={!!invoice} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-4xl p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {t("invoices.view.title", { number: invoice.number })}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">{t("invoices.view.description")}</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/50 p-4 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">{t("invoices.view.fields.number")}</p>
                            <p className="font-medium">{invoice.number}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">{t("invoices.view.fields.title")}</p>
                            <p className="font-medium">{invoice.title || "—"}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">{t("invoices.view.fields.status")}</p>
                            <p className="font-medium">{getStatusLabel(invoice.status)}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">{t("invoices.view.fields.createdAt")}</p>
                            <p className="font-medium">{formatDate(invoice.createdAt)}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">{t("invoices.view.fields.dueDate")}</p>
                            <p className="font-medium">{formatDate(invoice.dueDate)}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">{t("invoices.view.fields.paidAt")}</p>
                            <p className="font-medium">{formatDate(invoice.paidAt)}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">{t("invoices.view.fields.updatedAt")}</p>
                            <p className="font-medium">{formatDate(invoice.updatedAt)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/50 p-4 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">{t("invoices.view.fields.client")}</p>
                            <p className="font-medium">{invoice.client?.name || invoice.clientId}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">{t("invoices.view.fields.paymentMethod")}</p>
                            <p className="font-medium">{invoice.paymentMethod || "—"}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-muted/50 p-4 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">{t("invoices.view.fields.totalHT")}</p>
                            <p className="font-medium">{invoice.totalHT.toFixed(2)} {invoice.company.currency}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">{t("invoices.view.fields.totalVAT")}</p>
                            <p className="font-medium">{invoice.totalVAT.toFixed(2)} {invoice.company.currency}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">{t("invoices.view.fields.totalTTC")}</p>
                            <p className="font-medium">{invoice.totalTTC.toFixed(2)} {invoice.company.currency}</p>
                        </div>
                    </div>

                    {invoice.notes && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-2">{t("invoices.view.fields.notes")}</p>
                            <p className="font-medium">{invoice.notes}</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
