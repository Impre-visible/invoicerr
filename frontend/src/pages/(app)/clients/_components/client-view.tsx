import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import type { Client } from "@/types";

interface ClientViewDialogProps {
    client: Client | null;
    onOpenChange: (open: boolean) => void;
}

export function ClientViewDialog({ client, onOpenChange }: ClientViewDialogProps) {
    return (
        <Dialog open={client != null} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] lg:max-w-lg max-h-[90dvh] w-fit p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Client Details</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        View all relevant information about this client.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 bg-muted/50 p-4 rounded-lg w-full">
                        <div className="w-fit">
                            <p className="text-sm text-muted-foreground">Company Name</p>
                            <p className="font-medium">{client?.name || "—"}</p>
                        </div>
                        <div className="w-fit">
                            <p className="text-sm text-muted-foreground">Contact Person</p>
                            <p className="font-medium">
                                {client?.contactFirstname} {client?.contactLastname}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 bg-muted/50 p-4 rounded-lg w-full">
                        <div className="w-fit">
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{client?.contactEmail || "—"}</p>
                        </div>
                        {client?.contactPhone && (
                            <div className="w-fit">
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-medium">{client.contactPhone}</p>
                            </div>
                        )}
                    </div>

                    {(client?.address || client?.postalCode || client?.city || client?.country) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 bg-muted/50 p-4 rounded-lg w-full">
                            {client?.address && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Address</p>
                                    <p className="font-medium">{client.address}</p>
                                </div>
                            )}
                            {client?.postalCode && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Postal Code</p>
                                    <p className="font-medium">{client.postalCode}</p>
                                </div>
                            )}
                            {client?.city && (
                                <div>
                                    <p className="text-sm text-muted-foreground">City</p>
                                    <p className="font-medium">{client.city}</p>
                                </div>
                            )}
                            {client?.country && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Country</p>
                                    <p className="font-medium">{client.country}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
