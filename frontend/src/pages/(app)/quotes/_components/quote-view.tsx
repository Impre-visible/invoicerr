import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import type { Quote } from "@/types";
import { format } from "date-fns";

interface QuoteViewDialogProps {
    quote: Quote | null;
    onOpenChange: (open: boolean) => void;
}

export function QuoteViewDialog({ quote, onOpenChange }: QuoteViewDialogProps) {
    if (!quote) return null;

    const formatDate = (date?: Date) =>
        date ? format(new Date(date), "PPP") : "—";

    return (
        <Dialog open={!!quote} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-4xl p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        Quote {quote.number}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        View all relevant information about this quote.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/50 p-4 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">Title</p>
                            <p className="font-medium">{quote.title || "—"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <p className="font-medium capitalize">{quote.status}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Created At</p>
                            <p className="font-medium">{formatDate(quote.createdAt)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Valid Until</p>
                            <p className="font-medium">{formatDate(quote.validUntil)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Signed At</p>
                            <p className="font-medium">{formatDate(quote.signedAt)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Viewed At</p>
                            <p className="font-medium">{formatDate(quote.viewedAt)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/50 p-4 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">Client</p>
                            <p className="font-medium">{quote.client.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Signed By</p>
                            <p className="font-medium">{quote.signedBy || "—"}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-muted/50 p-4 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">Total HT</p>
                            <p className="font-medium">{quote.totalHT.toFixed(2)} €</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total VAT</p>
                            <p className="font-medium">{quote.totalVAT.toFixed(2)} €</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total TTC</p>
                            <p className="font-medium">{quote.totalTTC.toFixed(2)} €</p>
                        </div>
                    </div>

                    {quote.signatureSvg && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-2">Signature</p>
                            <div
                                className="border rounded bg-white p-2"
                                dangerouslySetInnerHTML={{ __html: quote.signatureSvg }}
                            />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
