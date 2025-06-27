import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import type { Client } from "@/types"
import { useDelete } from "@/lib/utils"

interface ClientDeleteDialogProps {
    client: Client | null
    onOpenChange: (open: boolean) => void
}

export function ClientDeleteDialog({ client, onOpenChange }: ClientDeleteDialogProps) {

    const { trigger } = useDelete(`/api/clients/${client?.id}`)

    const handleDelete = () => {
        if (!client) return;

        trigger()
            .then(() => {
                onOpenChange(false);
            })
            .catch((error) => {
                console.error("Failed to delete client:", error);
            });
    }

    return (
        <Dialog open={client != null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Client</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this client? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
