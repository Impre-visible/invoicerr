"use client"

import type { CreditNote, Invoice, InvoiceItem } from "@/types"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useEffect, useState } from "react"
import { useGet, usePatch, usePost } from "@/lib/utils"

import { BetterInput } from "@/components/better-input"
import { Button } from "@/components/ui/button"
import { ClientUpsert } from "../../clients/_components/client-upsert"
import { Input } from "@/components/ui/input"
import SearchSelect from "@/components/search-input"
import { Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

interface CreditNoteUpsertDialogProps {
    creditNote?: CreditNote | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface Item {
    creditNoteId: string
    description: string
    amountPaid: number
}

export function CreditNoteUpsert({ creditNote, open, onOpenChange }: CreditNoteUpsertDialogProps) {
    const { t } = useTranslation()
    const isEdit = !!creditNote

    const [clientDialogOpen, setClientDialogOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [selectedItem, setSelectedItem] = useState<InvoiceItem | null>(null)
    const [items, setItems] = useState<Item[]>(creditNote?.items.map(item => ({
        creditNoteId: item.creditNoteId,
        description: creditNote.invoice?.items.find(invItem => invItem.id === item.creditNoteId)?.description || "",
        amountPaid: item.unitPrice * item.quantity * (1 + item.vatRate / 100)
    })) || [])

    const creditNoteSchema = z.object({
        invoiceId: z.string().optional(),
        paymentMethod: z.string().optional(),
        paymentDetails: z.string().optional()
    })

    const { data: invoices } = useGet<Invoice[]>(`/api/invoices/search?query=${searchTerm}`)
    const { trigger: createTrigger, loading: createLoading } = usePost("/api/credit-notes")
    const { trigger: updateTrigger, loading: updateLoading } = usePatch(`/api/credit-notes/${creditNote?.id}`)

    const form = useForm<z.infer<typeof creditNoteSchema>>({
        resolver: zodResolver(creditNoteSchema),
        defaultValues: {
            invoiceId: creditNote?.invoiceId || ""
        },
    })

    useEffect(() => {
        if (isEdit && creditNote) {
            form.reset({
                invoiceId: creditNote.invoiceId || "",
            })
            setItems(creditNote.items.map(item => ({
                creditNoteId: item.creditNoteId,
                description: creditNote.invoice?.items.find(invItem => invItem.id === item.creditNoteId)?.description || "",
                amountPaid: item.unitPrice * item.quantity * (1 + item.vatRate / 100)
            })))
            setSelectedInvoice(creditNote.invoice || null)
            setSelectedItem(null)
        } else {
            form.reset({
                invoiceId: "",
                paymentMethod: "",
                paymentDetails: ""
            })
            setItems([])
        }
    }, [creditNote, form, isEdit])

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setSelectedInvoice(null)
            setSelectedItem(null)
            setItems([])
            form.reset()
        }
        onOpenChange(open)
    }

    const onSubmit = (data: z.infer<typeof creditNoteSchema>) => {
        const trigger = isEdit ? updateTrigger : createTrigger
        trigger({
            ...data,
            items: items.map(item => ({
                creditNoteId: item.creditNoteId,
                invoiceId: selectedInvoice?.id || "",
                amountPaid: item.amountPaid,
            }))
        })
            .then(() => {
                onOpenChange(false)
                form.reset()
            })
            .catch((err) => console.error(err))
    }

    const onAddItem = () => {
        if (selectedItem) {
            setItems([...items, {
                creditNoteId: selectedItem.id,
                description: selectedItem.description,
                amountPaid: selectedItem.unitPrice * selectedItem.quantity
            }])
        }
    }

    const onRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const onEditItem = (index: number, field: keyof Item) => (value: string | number) => {
        setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item))
    }

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="max-w-sm lg:max-w-4xl min-w-fit max-h-[90vh] overflow-y-auto overflow-visible">
                    <DialogHeader className="h-fit">
                        <DialogTitle>{t(`credit-notes.upsert.title.${isEdit ? "edit" : "create"}`)}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <FormField
                                control={form.control}
                                name="invoiceId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>{t("credit-notes.upsert.form.invoice.label")}</FormLabel>
                                        <FormControl>
                                            <SearchSelect
                                                options={(invoices || []).map((invoice) => ({ label: invoice.rawNumber || invoice.number.toString(), value: invoice.id }))}
                                                value={field.value ?? ""}
                                                onValueChange={(val) => { field.onChange(val || null); setSelectedInvoice(invoices?.find(inv => inv.id === val) || null); setSelectedItem(null) }}
                                                onSearchChange={setSearchTerm}
                                                placeholder={t("credit-notes.upsert.form.invoice.placeholder")}
                                                noResultsText={t("credit-notes.upsert.form.invoice.noResults")}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <section className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <FormField
                                    control={form.control}
                                    name="paymentMethod"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("credit-notes.upsert.form.paymentMethod.label")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t("credit-notes.upsert.form.paymentMethod.placeholder")}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                {t("credit-notes.upsert.form.paymentMethod.description")}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="paymentDetails"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("credit-notes.upsert.form.paymentDetails.label")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t("credit-notes.upsert.form.paymentDetails.placeholder")}
                                                    className="max-h-40"
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                {t("credit-notes.upsert.form.paymentDetails.description")}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </section>



                            <FormItem className="flex flex-col gap-2 mt-2">
                                <FormLabel className="mb-0">{t("credit-notes.upsert.form.items.label")}</FormLabel>

                                <section className="grid grid-cols-1 md:grid-cols-4 gap-2 !m-0">
                                    <FormItem className="col-span-3">
                                        <FormControl>
                                            <SearchSelect
                                                options={(selectedInvoice?.items || [])
                                                    .filter(item => !items.some(i => i.creditNoteId === item.id))
                                                    .map(item => ({ label: item.description, value: item.id }))}
                                                value={selectedItem?.id || undefined}
                                                onValueChange={(val) => {
                                                    setSelectedItem((selectedInvoice?.items || []).find(item => item.id === val) || null);
                                                }}
                                                onSearchChange={setSearchTerm}
                                                placeholder={t("credit-notes.upsert.form.items.placeholder")}
                                                noResultsText={t("credit-notes.upsert.form.items.noResults")}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={!selectedItem}
                                        onClick={onAddItem}
                                    >
                                        {t("credit-notes.upsert.form.items.addButton")}
                                    </Button>
                                </section>
                                <div className="flex flex-col gap-2">
                                    {items.map((item, index) => (
                                        <div className="flex gap-2 items-center">
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <BetterInput
                                                        defaultValue={item.description || ""}
                                                        placeholder={t("credit-notes.upsert.form.items.description.placeholder")}
                                                        onChange={(e) => onEditItem(index, "description")(e.target.value)}
                                                        disabled
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                            <FormItem>
                                                <FormControl>
                                                    <BetterInput
                                                        defaultValue={item.amountPaid || ""}
                                                        placeholder={t("credit-notes.upsert.form.items.amountPaid.placeholder")}
                                                        onChange={(e) => onEditItem(index, "amountPaid")(parseFloat(e.target.value))}
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        postAdornment={selectedInvoice?.currency || ""}
                                                        disabled={!selectedInvoice}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>

                                            <Button variant={"outline"} onClick={() => onRemoveItem(index)} type="reset" className="h-8">
                                                <Trash2 className="h-4 w-4 text-red-700" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </FormItem>
                        </form>
                    </Form>
                    <DialogFooter className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {t("credit-notes.upsert.actions.cancel")}
                        </Button>
                        <Button type="button" onClick={form.handleSubmit(onSubmit)} loading={createLoading || updateLoading}>
                            {t(`credit-notes.upsert.actions.${isEdit ? "save" : "create"}`)}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ClientUpsert
                open={clientDialogOpen}
                onOpenChange={setClientDialogOpen}
            />
        </>
    )
}
