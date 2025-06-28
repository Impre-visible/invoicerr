import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import type { Invoice } from "@/types"
import { useDelete } from "@/lib/utils"

interface InvoiceDeleteDialogProps {
    invoice: Invoice | null
    onOpenChange: (open: boolean) => void
}

export function InvoiceDeleteDialog({ invoice, onOpenChange }: InvoiceDeleteDialogProps) {

    const { trigger } = useDelete(`/api/invoices/${invoice?.id}`)

    const handleDelete = () => {
        if (!invoice) return;

        trigger()
            .then(() => {
                onOpenChange(false);
            })
            .catch((error) => {
                console.error("Failed to delete invoice:", error);
            });
    }

    return (
        <Dialog open={invoice != null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Invoice</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this invoice? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex justify-end space-x-2">
                    <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button variant="destructive" className="w-full" onClick={handleDelete}>
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
