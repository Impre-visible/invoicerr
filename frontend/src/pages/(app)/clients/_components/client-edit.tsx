import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

import { Button } from "@/components/ui/button"
import type { Client } from "@/types"
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
        name: z.string().min(1, t("clients.edit.validation.name.required")),
        description: z
            .string()
            .min(1, t("clients.edit.validation.description.required"))
            .max(500, t("clients.edit.validation.description.maxLength")),
        legalId: z
            .string({ required_error: t("clients.edit.validation.legalId.required") })
            .min(1, t("clients.edit.validation.legalId.empty"))
            .max(50, t("clients.edit.validation.legalId.maxLength")),
        VAT: z
            .string({ required_error: t("clients.edit.validation.vat.required") })
            .min(1, t("clients.edit.validation.vat.empty"))
            .max(15, t("clients.edit.validation.vat.maxLength"))
            .refine((val) => {
                return /^[A-Z]{2}[0-9A-Z]{8,12}$/.test(val)
            }, t("clients.edit.validation.vat.format")),
        foundedAt: z.date().refine((date) => date <= new Date(), t("clients.edit.validation.foundedAt.future")),
        contactFirstname: z.string().min(1, t("clients.edit.validation.contactFirstname.required")),
        contactLastname: z.string().min(1, t("clients.edit.validation.contactLastname.required")),
        contactPhone: z
            .string()
            .min(8, t("clients.edit.validation.contactPhone.minLength"))
            .refine((val) => {
                return /^[+]?[0-9\s\-()]{8,20}$/.test(val)
            }, t("clients.edit.validation.contactPhone.format")),
        contactEmail: z
            .string()
            .email()
            .min(1, t("clients.edit.validation.contactEmail.required"))
            .refine((val) => {
                return z.string().email().safeParse(val).success
            }, t("clients.edit.validation.contactEmail.format")),
        address: z.string().min(1, t("clients.edit.validation.address.required")),
        postalCode: z.string().refine((val) => {
            return /^[0-9A-Z\s-]{3,10}$/.test(val)
        }, t("clients.edit.validation.postalCode.format")),
        city: z.string().min(1, t("clients.edit.validation.city.required")),
        country: z.string().min(1, t("clients.edit.validation.country.required")),
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
                    <DialogTitle>{t("clients.edit.title")}</DialogTitle>
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
                                            <FormLabel required>{t("clients.edit.fields.contactFirstname.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.edit.fields.contactFirstname.placeholder")} />
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
                                            <FormLabel required>{t("clients.edit.fields.contactLastname.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.edit.fields.contactLastname.placeholder")} />
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
                                        <FormLabel required>{t("clients.edit.fields.name.label")}</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder={t("clients.edit.fields.name.placeholder")} />
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
                                        <FormLabel required>{t("clients.edit.fields.description.label")}</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder={t("clients.edit.fields.description.placeholder")} />
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
                                            <FormLabel required>{t("clients.edit.fields.legalId.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.edit.fields.legalId.placeholder")} />
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
                                            <FormLabel required>{t("clients.edit.fields.vat.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.edit.fields.vat.placeholder")} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="foundedAt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>{t("clients.edit.fields.foundedAt.label")}</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                value={field.value || null}
                                                onChange={(date) => field.onChange(date || new Date())}
                                                placeholder={t("clients.edit.fields.foundedAt.placeholder")}
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
                                            <FormLabel required>{t("clients.edit.fields.contactEmail.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.edit.fields.contactEmail.placeholder")} />
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
                                            <FormLabel required>{t("clients.edit.fields.contactPhone.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.edit.fields.contactPhone.placeholder")} />
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
                                        <FormLabel required>{t("clients.edit.fields.address.label")}</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder={t("clients.edit.fields.address.placeholder")} />
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
                                            <FormLabel required>{t("clients.edit.fields.postalCode.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.edit.fields.postalCode.placeholder")} />
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
                                            <FormLabel required>{t("clients.edit.fields.city.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.edit.fields.city.placeholder")} />
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
                                            <FormLabel required>{t("clients.edit.fields.country.label")}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t("clients.edit.fields.country.placeholder")} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    {t("clients.edit.actions.cancel")}
                                </Button>
                                <Button type="submit">{t("clients.edit.actions.save")}</Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
