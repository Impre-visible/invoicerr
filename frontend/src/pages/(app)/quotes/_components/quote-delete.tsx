import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import type { Quote } from "@/types"
import { useDelete } from "@/lib/utils"

interface QuoteDeleteDialogProps {
    quote: Quote | null
    onOpenChange: (open: boolean) => void
}

export function QuoteDeleteDialog({ quote, onOpenChange }: QuoteDeleteDialogProps) {

    const { trigger } = useDelete(`/api/quotes/${quote?.id}`)

    const handleDelete = () => {
        if (!quote) return;

        trigger()
            .then(() => {
                onOpenChange(false);
            })
            .catch((error) => {
                console.error("Failed to delete quote:", error);
            });
    }

    return (
        <Dialog open={quote != null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Quote</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this quote? This action cannot be undone.
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
