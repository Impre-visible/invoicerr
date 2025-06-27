import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import type { Client } from "@/types"

interface ClientViewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    client: Client | null
}

export function ClientViewDialog({ open, onOpenChange, client }: ClientViewDialogProps) {
    if (!client) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Client Details</DialogTitle>
                    <DialogDescription>View client information</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Company Name</label>
                            <p>{client.name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Contact</label>
                            <p>
                                {client.contactFirstname} {client.contactLastname}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Email</label>
                        <p>{client.contactEmail}</p>
                    </div>
                    {client.contactPhone && (
                        <div>
                            <label className="text-sm font-medium">Phone</label>
                            <p>{client.contactPhone}</p>
                        </div>
                    )}

                    {client.address && (
                        <div>
                            <label className="text-sm font-medium">Address</label>
                            <p>{client.address}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                        {client.postalCode && (
                            <div>
                                <label className="text-sm font-medium">Postal Code</label>
                                <p>{client.postalCode}</p>
                            </div>
                        )}
                        {client.city && (
                            <div>
                                <label className="text-sm font-medium">City</label>
                                <p>{client.city}</p>
                            </div>
                        )}
                        {client.country && (
                            <div>
                                <label className="text-sm font-medium">Country</label>
                                <p>{client.country}</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
