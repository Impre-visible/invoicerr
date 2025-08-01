"use client"

import type { CreditNote, Invoice, InvoiceItem } from "@/types"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useEffect, useState } from "react"
import { useGet, usePatch, usePost } from "@/lib/utils"

import { BetterInput } from "@/components/better-input"
import { Button } from "@/components/ui/button"
import { ClientUpsert } from "../../clients/_components/client-upsert"
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
    invoiceItemId: string
    description: string
    quantity: number
    unitPrice: number
    vatRate: number
    amountPaid?: number
}

export function CreditNoteUpsert({ creditNote, open, onOpenChange }: CreditNoteUpsertDialogProps) {
    const { t } = useTranslation()
    const isEdit = !!creditNote

    const [clientDialogOpen, setClientDialogOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [selectedItem, setSelectedItem] = useState<InvoiceItem | null>(null)
    const [items, setItems] = useState<Item[]>(creditNote?.items.map(item => ({
        invoiceItemId: item.invoiceItemId,
        description: creditNote.invoice?.items.find(invItem => invItem.id === item.invoiceItemId)?.description || "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate || 0,
        amountPaid: item.unitPrice * item.quantity * (1 + (item.vatRate / 100))
    })) || [])

    const creditNoteSchema = z.object({
        invoiceId: z.string().optional()
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
                invoiceItemId: item.invoiceItemId,
                description: creditNote.invoice?.items.find(invItem => invItem.id === item.invoiceItemId)?.description || "",
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                vatRate: item.vatRate || 0,
                amountPaid: item.unitPrice * item.quantity * (1 + (item.vatRate / 100))
            })))
            setSelectedInvoice(creditNote.invoice || null)
            setSelectedItem(null)
        } else {
            form.reset({
                invoiceId: ""
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
                invoiceItemId: item.invoiceItemId,
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
                invoiceItemId: selectedItem.id,
                description: selectedItem.description,
                quantity: 1,
                unitPrice: selectedItem.unitPrice || 0,
                vatRate: selectedItem.vatRate || 0,
                amountPaid: (selectedItem.unitPrice || 0) * 1 * (1 + (selectedItem.vatRate || 0) / 100)
            }])
        }
    }

    const onRemoveItem = (index: number) => {
        setItems((items || []).filter((_, i) => i !== index))
    }

    const onEditItem = (index: number, field: keyof Item, value: any) => {
        setItems(items.map((item, i) => {
            if (i === index) {
                return {
                    ...item,
                    [field]: value,
                    amountPaid: (item.unitPrice || 0) * (item.quantity || 1) * (1 + (item.vatRate || 0) / 100)
                }
            }
            return item
        }))
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

                            <FormItem className="flex flex-col gap-2 mt-2">
                                <FormLabel className="mb-0">{t("credit-notes.upsert.form.items.label")}</FormLabel>

                                <section className="grid grid-cols-1 md:grid-cols-4 gap-2 !m-0">
                                    <FormItem className="col-span-3">
                                        <FormControl>
                                            <SearchSelect
                                                options={(selectedInvoice?.items || [])
                                                    .filter(item => !items.some(i => i.invoiceItemId === item.id))
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
                                            <FormItem>
                                                <FormControl>
                                                    <BetterInput
                                                        defaultValue={item.description}
                                                        placeholder={t(
                                                            `invoices.upsert.form.items.description.placeholder`,
                                                        )}
                                                        disabled
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>

                                            <FormItem>
                                                <FormControl>
                                                    <BetterInput
                                                        defaultValue={item.quantity || ""}
                                                        postAdornment={t(`invoices.upsert.form.items.quantity.unit`)}
                                                        type="number"
                                                        placeholder={t(
                                                            `invoices.upsert.form.items.quantity.placeholder`,
                                                        )}
                                                        onChange={(e) =>
                                                            onEditItem(index, "quantity", e.target.value === "" ? undefined : Number(e.target.value))
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>

                                            <FormItem>
                                                <FormControl>
                                                    <BetterInput
                                                        defaultValue={item.unitPrice || ""}
                                                        postAdornment={selectedInvoice?.currency || "€"}
                                                        type="number"
                                                        placeholder={t(
                                                            `invoices.upsert.form.items.unitPrice.placeholder`,
                                                        )}
                                                        onChange={(e) =>
                                                            onEditItem(index, "unitPrice", e.target.value === "" ? undefined : Number(e.target.value.replace(",", ".")))
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>

                                            <FormItem>
                                                <FormControl>
                                                    <BetterInput
                                                        defaultValue={item.vatRate || ""}
                                                        postAdornment="%"
                                                        type="number"
                                                        step="0.01"
                                                        placeholder={t(
                                                            `invoices.upsert.form.items.vatRate.placeholder`,
                                                        )}
                                                        onChange={(e) =>
                                                            onEditItem(index, "vatRate", e.target.value === "" ? undefined : Number(e.target.value.replace(",", ".")))
                                                        }
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
