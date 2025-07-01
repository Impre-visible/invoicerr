import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import type { Quote } from "@/types"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"

interface QuoteViewDialogProps {
    quote: Quote | null
    onOpenChange: (open: boolean) => void
}

export function QuoteViewDialog({ quote, onOpenChange }: QuoteViewDialogProps) {
    const { t } = useTranslation()

    if (!quote) return null

    const formatDate = (date?: Date) => (date ? format(new Date(date), "PPP") : "—")

    const getStatusLabel = (status: string) => {
        return t(`quotes.view.status.${status.toLowerCase()}`)
    }

    return (
        <Dialog open={!!quote} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-4xl p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {t("quotes.view.title", { number: quote.number })}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">{t("quotes.view.description")}</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/50 p-4 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">{t("quotes.view.fields.title")}</p>
                            <p className="font-medium">{quote.title || "—"}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">{t("quotes.view.fields.status")}</p>
                            <p className="font-medium capitalize">{getStatusLabel(quote.status)}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">{t("quotes.view.fields.createdAt")}</p>
                            <p className="font-medium">{formatDate(quote.createdAt)}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">{t("quotes.view.fields.validUntil")}</p>
                            <p className="font-medium">{formatDate(quote.validUntil)}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">{t("quotes.view.fields.signedAt")}</p>
                            <p className="font-medium">{formatDate(quote.signedAt)}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">{t("quotes.view.fields.viewedAt")}</p>
                            <p className="font-medium">{formatDate(quote.viewedAt)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/50 p-4 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">{t("quotes.view.fields.client")}</p>
                            <p className="font-medium">{quote.client.name}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">{t("quotes.view.fields.signedBy")}</p>
                            <p className="font-medium">{quote.signedBy || "—"}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-muted/50 p-4 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">{t("quotes.view.fields.totalHT")}</p>
                            <p className="font-medium">{quote.totalHT.toFixed(2)} {quote.company.currency}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">{t("quotes.view.fields.totalVAT")}</p>
                            <p className="font-medium">{quote.totalVAT.toFixed(2)} {quote.company.currency}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">{t("quotes.view.fields.totalTTC")}</p>
                            <p className="font-medium">{quote.totalTTC.toFixed(2)} {quote.company.currency}</p>
                        </div>
                    </div>

                    {quote.signatureSvg && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-2">{t("quotes.view.fields.signature")}</p>
                            <div className="border rounded bg-white p-2" dangerouslySetInnerHTML={{ __html: quote.signatureSvg }} />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
