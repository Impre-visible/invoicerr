import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import type { Invoice } from "@/types";
import { format } from "date-fns";

interface InvoiceViewDialogProps {
    invoice: Invoice | null;
    onOpenChange: (open: boolean) => void;
}

export function InvoiceViewDialog({ invoice, onOpenChange }: InvoiceViewDialogProps) {
    if (!invoice) return null;

    const formatDate = (date?: string) =>
        date ? format(new Date(date), "PPP") : "—";

    return (
        <Dialog open={!!invoice} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-4xl p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        Invoice {invoice.number}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        View all relevant information about this invoice.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/50 p-4 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">Number</p>
                            <p className="font-medium">{invoice.number}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Title</p>
                            <p className="font-medium">{invoice.title || "—"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <p className="font-medium capitalize">{invoice.status}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Created At</p>
                            <p className="font-medium">{formatDate(invoice.createdAt)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Due Date</p>
                            <p className="font-medium">{formatDate(invoice.dueDate)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Paid At</p>
                            <p className="font-medium">{formatDate(invoice.paidAt)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Updated At</p>
                            <p className="font-medium">{formatDate(invoice.updatedAt)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/50 p-4 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">Client ID</p>
                            <p className="font-medium">{invoice.clientId}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Payment Method</p>
                            <p className="font-medium">{invoice.paymentMethod || "—"}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-muted/50 p-4 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">Total HT</p>
                            <p className="font-medium">{invoice.totalHT.toFixed(2)} €</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total VAT</p>
                            <p className="font-medium">{invoice.totalVAT.toFixed(2)} €</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total TTC</p>
                            <p className="font-medium">{invoice.totalTTC.toFixed(2)} €</p>
                        </div>
                    </div>

                    {invoice.notes && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-2">Notes</p>
                            <p className="font-medium">{invoice.notes}</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
