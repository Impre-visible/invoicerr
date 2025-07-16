import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

import { Button } from "@/components/ui/button"
import type { Client } from "@/types"
import CurrencySelect from "@/components/currency-select"
import { DatePicker } from "@/components/date-picker"
import { Input } from "@/components/ui/input"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { usePatch } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

interface ClientEditDialogProps {
    client: Client | null
    onOpenChange: (open: boolean) => void
}

export function ClientEdit({ client, onOpenChange }: ClientEditDialogProps) {
    const { t } = useTranslation()
    const { trigger } = usePatch(`/api/clients/${client?.id}`)

    const clientSchema = z.object({
        name: z.string().min(1, t("clients.upsert.validation.name.required")),
        description: z
            .string()
            .min(1, t("clients.upsert.validation.description.required"))
            .max(500, t("clients.upsert.validation.description.maxLength"))
            .optional(),
        legalId: z
            .string()
            .max(50, t("clients.upsert.validation.legalId.maxLength"))
            .optional(),
        VAT: z
            .string()
            .max(15, t("clients.upsert.validation.vat.maxLength"))
            .refine((val) => {
                if (!val) return true // Skip validation if VAT is not provided
                return /^[A-Z]{2}[0-9A-Z]{8,12}$/.test(val)
            }, t("clients.upsert.validation.vat.format"))
            .optional(),
        currency: z.string().nullable().optional(),
        foundedAt: z.date().refine((date) => date <= new Date(), t("clients.upsert.validation.foundedAt.future")),
        contactFirstname: z.string().min(1, t("clients.upsert.validation.contactFirstname.required")),
        contactLastname: z.string().min(1, t("clients.upsert.validation.contactLastname.required")),
        contactPhone: z
            .string()
            .min(8, t("clients.upsert.validation.contactPhone.minLength"))
            .refine((val) => {
                return /^[+]?[0-9\s\-()]{8,20}$/.test(val)
            }, t("clients.upsert.validation.contactPhone.format")),
        contactEmail: z
            .string()
            .email()
            .min(1, t("clients.upsert.validation.contactEmail.required"))
            .refine((val) => {
                return z.string().email().safeParse(val).success
            }, t("clients.upsert.validation.contactEmail.format")),
        address: z.string().min(1, t("clients.upsert.validation.address.required")),
        postalCode: z.string().refine((val) => {
            return /^[0-9A-Z\s-]{3,10}$/.test(val)
        }, t("clients.upsert.validation.postalCode.format")),
        city: z.string().min(1, t("clients.upsert.validation.city.required")),
        country: z.string().min(1, t("clients.upsert.validation.country.required")),
    })

    const form = useForm<z.infer<typeof clientSchema>>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: "",
            description: "",
            legalId: "",
            VAT: "",
            currency: undefined,
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

    useEffect(() => {
        if (client) {
            form.reset({
                ...client,
                foundedAt: new Date(client.foundedAt),
            })
        }
    }, [client, form])

    const handleSubmit = (data: z.infer<typeof clientSchema>) => {
        trigger(data)
            .then(() => {
                onOpenChange(false)
                form.reset()
            })
            .catch((error) => {
                console.error("Failed to edit client:", error)
            })
    }

    return (
        <Dialog open={!!client} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] lg:max-w-3xl max-h-[90dvh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{t("clients.upsert.title.edit")}</DialogTitle>
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
                                            <FormLabel required>{t("clients.upsert.fields.contactFirstname.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.upsert.fields.contactFirstname.placeholder")} />
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
                                            <FormLabel required>{t("clients.upsert.fields.contactLastname.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.upsert.fields.contactLastname.placeholder")} />
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
                                        <FormLabel required>{t("clients.upsert.fields.name.label")}</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder={t("clients.upsert.fields.name.placeholder")} />
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
                                        <FormLabel>{t("clients.upsert.fields.description.label")}</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder={t("clients.upsert.fields.description.placeholder")} />
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
                                            <FormLabel>{t("clients.upsert.fields.legalId.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.upsert.fields.legalId.placeholder")} />
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
                                            <FormLabel>{t("clients.upsert.fields.vat.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.upsert.fields.vat.placeholder")} />
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
                                        <FormLabel>{t("clients.upsert.fields.currency.label")}</FormLabel>
                                        <FormControl>
                                            <CurrencySelect
                                                value={field.value}
                                                onChange={(value) => field.onChange(value)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="foundedAt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>{t("clients.upsert.fields.foundedAt.label")}</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                value={field.value || null}
                                                onChange={(date) => field.onChange(date || new Date())}
                                                placeholder={t("clients.upsert.fields.foundedAt.placeholder")}
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
                                            <FormLabel required>{t("clients.upsert.fields.contactEmail.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.upsert.fields.contactEmail.placeholder")} />
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
                                            <FormLabel required>{t("clients.upsert.fields.contactPhone.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.upsert.fields.contactPhone.placeholder")} />
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
                                        <FormLabel required>{t("clients.upsert.fields.address.label")}</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder={t("clients.upsert.fields.address.placeholder")} />
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
                                            <FormLabel required>{t("clients.upsert.fields.postalCode.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.upsert.fields.postalCode.placeholder")} />
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
                                            <FormLabel required>{t("clients.upsert.fields.city.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.upsert.fields.city.placeholder")} />
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
                                            <FormLabel required>{t("clients.upsert.fields.country.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.upsert.fields.country.placeholder")} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    {t("clients.upsert.actions.cancel")}
                                </Button>
                                <Button type="submit">{t("clients.upsert.actions.save")}</Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
