import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

import { Button } from "@/components/ui/button"
import type { Client } from "@/types"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"

interface ClientEditDialogProps {
    client: Client | null
    onOpenChange: (open: boolean) => void
}

export function ClientEdit({ client, onOpenChange }: ClientEditDialogProps) {
    const form = useForm<Client>({
        defaultValues: {
            name: "",
            contactFirstname: "",
            contactLastname: "",
            contactEmail: "",
            contactPhone: "",
            address: "",
            postalCode: "",
            city: "",
            country: "",
            isActive: true,
        },
    })

    const handleSubmit = () => {

    }

    return (
        <Dialog open={client != null} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create or Edit Client</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="contactFirstname"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>First Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="John" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contactLastname"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>Last Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Doe" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel required>Company Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Acme Corp" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="contactEmail"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>Email</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="john.doe@acme.org" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contactPhone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>Phone</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="+1 (555) 123-4567" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel required>Address</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="123 Main St, Suite 100" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="postalCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>Postal Code</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="12345" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>City</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="New York" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>Country</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="USA" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Edit</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
