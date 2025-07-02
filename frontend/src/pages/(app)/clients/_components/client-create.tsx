import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

import { Button } from "@/components/ui/button"
import CurrencySelect from "@/components/currency-select"
import { DatePicker } from "@/components/date-picker"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { usePost } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

interface ClientCreateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ClientCreate({ open, onOpenChange }: ClientCreateDialogProps) {
    const { t } = useTranslation()
    const { trigger } = usePost("/api/clients")

    const clientSchema = z.object({
        name: z.string().min(1, t("clients.create.validation.name.required")),
        description: z
            .string()
            .min(1, t("clients.create.validation.description.required"))
            .max(500, t("clients.create.validation.description.maxLength")),
        legalId: z
            .string()
            .max(50, t("clients.create.validation.legalId.maxLength"))
            .optional(),
        VAT: z
            .string()
            .max(15, t("clients.create.validation.vat.maxLength"))
            .refine((val) => {
                if (!val) return true // Skip validation if VAT is not provided
                return /^[A-Z]{2}[0-9A-Z]{8,12}$/.test(val)
            }, t("clients.create.validation.vat.format"))
            .optional(),
        currency: z.string().optional(),
        foundedAt: z.date().refine((date) => date <= new Date(), t("clients.create.validation.foundedAt.future")),
        contactFirstname: z.string().min(1, t("clients.create.validation.contactFirstname.required")),
        contactLastname: z.string().min(1, t("clients.create.validation.contactLastname.required")),
        contactPhone: z
            .string()
            .min(8, t("clients.create.validation.contactPhone.minLength"))
            .refine((val) => {
                return /^[+]?[0-9\s\-()]{8,20}$/.test(val)
            }, t("clients.create.validation.contactPhone.format")),
        contactEmail: z
            .string()
            .email()
            .min(1, t("clients.create.validation.contactEmail.required"))
            .refine((val) => {
                return z.string().email().safeParse(val).success
            }, t("clients.create.validation.contactEmail.format")),
        address: z.string().min(1, t("clients.create.validation.address.required")),
        postalCode: z.string().refine((val) => {
            return /^[0-9A-Z\s-]{3,10}$/.test(val)
        }, t("clients.create.validation.postalCode.format")),
        city: z.string().min(1, t("clients.create.validation.city.required")),
        country: z.string().min(1, t("clients.create.validation.country.required")),
    })

    const form = useForm<z.infer<typeof clientSchema>>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: "",
            description: "",
            legalId: "",
            VAT: "",
            foundedAt: new Date(),
            contactFirstname: "",
            contactLastname: "",
            contactEmail: "",
            contactPhone: "",
            address: "",
            postalCode: "",
            city: "",
            country: "",
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
            <DialogContent className="max-w-[95vw] lg:max-w-3xl max-h-[90dvh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>{t("clients.create.title")}</DialogTitle>
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
                                            <FormLabel required>{t("clients.create.fields.contactFirstname.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.create.fields.contactFirstname.placeholder")} />
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
                                            <FormLabel required>{t("clients.create.fields.contactLastname.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.create.fields.contactLastname.placeholder")} />
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
                                        <FormLabel required>{t("clients.create.fields.name.label")}</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder={t("clients.create.fields.name.placeholder")} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>{t("clients.create.fields.description.label")}</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder={t("clients.create.fields.description.placeholder")} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="legalId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("clients.create.fields.legalId.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.create.fields.legalId.placeholder")} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="VAT"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("clients.create.fields.vat.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.create.fields.vat.placeholder")} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="currency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("clients.create.fields.currency.label")}</FormLabel>
                                        <FormControl>
                                            <CurrencySelect
                                                value={field.value}
                                                onChange={(value) => field.onChange(value)}
                                            />
                                        </FormControl>
                                        <FormMessage /> <CurrencySelect
                                            value={field.value}
                                            onChange={(value) => field.onChange(value)}
                                        />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="foundedAt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>{t("clients.create.fields.foundedAt.label")}</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                value={field.value || null}
                                                onChange={(date) => field.onChange(date || new Date())}
                                                placeholder={t("clients.create.fields.foundedAt.placeholder")}
                                                className="w-full"
                                            />
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
                                            <FormLabel required>{t("clients.create.fields.contactEmail.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.create.fields.contactEmail.placeholder")} />
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
                                            <FormLabel required>{t("clients.create.fields.contactPhone.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.create.fields.contactPhone.placeholder")} />
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
                                        <FormLabel required>{t("clients.create.fields.address.label")}</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder={t("clients.create.fields.address.placeholder")} />
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
                                            <FormLabel required>{t("clients.create.fields.postalCode.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.create.fields.postalCode.placeholder")} />
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
                                            <FormLabel required>{t("clients.create.fields.city.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.create.fields.city.placeholder")} />
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
                                            <FormLabel required>{t("clients.create.fields.country.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.create.fields.country.placeholder")} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    {t("clients.create.actions.cancel")}
                                </Button>
                                <Button type="submit">{t("clients.create.actions.create")}</Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
