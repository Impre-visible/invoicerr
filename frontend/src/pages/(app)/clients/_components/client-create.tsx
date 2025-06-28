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
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { usePost } from "@/lib/utils"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

interface ClientCreateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const clientSchema = z.object({
    name: z.string().min(1, "Company name is required"),

    contactFirstname: z.string().min(1, "First name is required"),
    contactLastname: z.string().min(1, "Last name is required"),
    contactPhone: z.string().min(8, "Phone number must be at least 8 characters").refine((val) => { return /^[+]?[0-9\s\-()]{8,20}$/.test(val) }, "Invalid phone number format"),
    contactEmail: z.string().email().min(1, "Email is required").refine((val) => { return z.string().email().safeParse(val).success }, "Invalid email format"),

    address: z.string().min(1, "Address cannot be empty"),
    postalCode: z.string().refine((val) => { return /^[0-9A-Z\s-]{3,10}$/.test(val) }, "Invalid postal code format"),
    city: z.string().min(1, "City cannot be empty"),
    country: z.string().min(1, "Country cannot be empty"),

})

export function ClientCreate({ open, onOpenChange }: ClientCreateDialogProps) {
    const { trigger } = usePost("/api/clients")

    const form = useForm<z.infer<typeof clientSchema>>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: "",
            contactFirstname: "",
            contactLastname: "",
            contactEmail: "",
            contactPhone: "",
            address: "",
            postalCode: "",
            city: "",
            country: ""
        },
    })

    const handleSubmit = (data: z.infer<typeof clientSchema>) => {
        trigger(data)
            .then(() => {
                onOpenChange(false)
                form.reset()
            })
            .catch((error) => {
                console.error("Failed to create client:", error)
            })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] lg:max-w-lg max-h-[90dvh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Create Client</DialogTitle>
                </DialogHeader>
                <div className="overflow-auto mt-2 flex-1">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                <Button type="submit">Create</Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
