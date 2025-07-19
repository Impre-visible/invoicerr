"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { Invoice, Receipt } from "@/types"
import { useEffect, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { useGet, usePatch, usePost } from "@/lib/utils"

import { BetterInput } from "@/components/better-input"
import { Button } from "@/components/ui/button"
import { ClientUpsert } from "../../clients/_components/client-upsert"
import { Input } from "@/components/ui/input"
import SearchSelect from "@/components/search-input"
import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

interface ReceiptUpsertDialogProps {
    receipt?: Receipt | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ReceiptUpsert({ receipt, open, onOpenChange }: ReceiptUpsertDialogProps) {
    const { t } = useTranslation()
    const isEdit = !!receipt

    const [clientDialogOpen, setClientDialogOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    const receiptSchema = z.object({
        invoiceId: z.string().optional(),
        paymentMethod: z.string().optional(),
        paymentDetails: z.string().optional(),
        items: z.array(
            z.object({
                id: z.string(),
                amountPaid: z.number().min(0),
            }),
        ),
    })

    const { data: invoices } = useGet<Invoice[]>(`/api/invoices/search?query=${searchTerm}`)
    const { trigger: createTrigger } = usePost("/api/receipts")
    const { trigger: updateTrigger } = usePatch(`/api/receipts/${receipt}`)

    const form = useForm<z.infer<typeof receiptSchema>>({
        resolver: zodResolver(receiptSchema),
        defaultValues: {
            invoiceId: receipt?.invoiceId || "",
            items: [],
        },
    })

    useEffect(() => {
        if (isEdit && receipt) {
            form.reset()
        } else {
            form.reset({
                invoiceId: "",
                items: [],
            })
        }
    }, [receipt, form, isEdit])

    const { control, handleSubmit } = form
    const { fields, remove } = useFieldArray({
        control,
        name: "items",
    })

    const onRemove = (index: number) => {
        remove(index)
    }

    const onSubmit = (data: z.infer<typeof receiptSchema>) => {
        console.debug("Submitting receipt data:", data)

        const trigger = isEdit ? updateTrigger : createTrigger

        trigger({
            ...data,
            totalPaid: data.items.reduce((sum, item) => sum + item.amountPaid, 0),
        })
            .then(() => {
                onOpenChange(false)
                form.reset()
            })
            .catch((err) => console.error(err))
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-sm lg:max-w-4xl min-w-fit max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t(`receipts.upsert.title.${isEdit ? "edit" : "create"}`)}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                            <FormField
                                control={control}
                                name="invoiceId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>{t("receipts.upsert.form.invoice.label")}</FormLabel>
                                        <FormControl>
                                            <SearchSelect
                                                options={(invoices || []).map((c) => ({ label: c.id, value: c.id }))}
                                                value={field.value ?? ""}
                                                onValueChange={(val) => field.onChange(val || null)}
                                                onSearchChange={setSearchTerm}
                                                placeholder={t("receipts.upsert.form.invoice.placeholder")}
                                                noResultsText={t("receipts.upsert.form.invoice.noResults")}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={control}
                                    name="paymentMethod"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("receipts.upsert.form.paymentMethod.label")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t("receipts.upsert.form.paymentMethod.placeholder")}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                {t("receipts.upsert.form.paymentMethod.description")}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={control}
                                    name="paymentDetails"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("receipts.upsert.form.paymentDetails.label")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t("receipts.upsert.form.paymentDetails.placeholder")}
                                                    className="max-h-40"
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                {t("receipts.upsert.form.paymentDetails.description")}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </section>

                            <FormItem>
                                <FormLabel>{t("receipts.upsert.form.items.label")}</FormLabel>
                                <div className="space-y-2">
                                    {fields.map((_, index) => (
                                        <div className="flex gap-2 items-center">
                                            <FormField
                                                control={control}
                                                name={`items.${index}.amountPaid`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <BetterInput
                                                                {...field}
                                                                defaultValue={field.value || ""}
                                                                postAdornment={t(`receipts.upsert.form.items.quantity.unit`)}
                                                                type="number"
                                                                placeholder={t(
                                                                    `receipts.upsert.form.items.quantity.placeholder`,
                                                                )}
                                                                onChange={(e) =>
                                                                    field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                                                                }
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <Button variant={"outline"} onClick={() => onRemove(index)}>
                                                <Trash2 className="h-4 w-4 text-red-700" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <FormField
                                    control={control}
                                    name="items"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <SearchSelect
                                                    options={(invoices || []).map((c) => ({ label: c.id, value: c.id }))}
                                                    value={""}
                                                    onValueChange={(val) => field.onChange(val || null)}
                                                    onSearchChange={setSearchTerm}
                                                    placeholder={t("receipts.upsert.form.items.placeholder")}
                                                    noResultsText={t("receipts.upsert.form.items.noResults")}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                            </FormItem>

                            <div className="flex justify-end space-x-2">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    {t("receipts.upsert.actions.cancel")}
                                </Button>
                                <Button type="submit">
                                    {t(`receipts.upsert.actions.${isEdit ? "save" : "create"}`)}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <ClientUpsert
                open={clientDialogOpen}
                onOpenChange={setClientDialogOpen}
            />
        </>
    )
}
