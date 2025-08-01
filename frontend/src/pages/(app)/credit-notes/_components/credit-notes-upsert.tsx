"use client"

import { ArrowDown, Trash2 } from "lucide-react"
import type { CreditNote, Invoice, InvoiceItem } from "@/types"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useEffect, useState } from "react"
import { useGet, usePatch, usePost } from "@/lib/utils"

import { BetterInput } from "@/components/better-input"
import { Button } from "@/components/ui/button"
import { ClientUpsert } from "../../clients/_components/client-upsert"
import SearchSelect from "@/components/search-input"
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
    originalItem: {
        description: string
        quantity: number
        unitPrice: number
        vatRate: number
        total: number
    }
    modifiedItem: {
        description: string
        quantity: number
        unitPrice: number
        vatRate: number
        total: number
    }
}

export function CreditNoteUpsert({ creditNote, open, onOpenChange }: CreditNoteUpsertDialogProps) {
    const { t } = useTranslation()
    const isEdit = !!creditNote
    const [clientDialogOpen, setClientDialogOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [selectedItem, setSelectedItem] = useState<InvoiceItem | null>(null)
    const [items, setItems] = useState<Item[]>([])

    const creditNoteSchema = z.object({
        invoiceId: z.string().optional(),
    })

    const { data: invoices } = useGet<Invoice[]>(`/api/invoices/search?query=${searchTerm}`)
    const { trigger: createTrigger, loading: createLoading } = usePost("/api/credit-notes")
    const { trigger: updateTrigger, loading: updateLoading } = usePatch(`/api/credit-notes/${creditNote?.id}`)

    const form = useForm<z.infer<typeof creditNoteSchema>>({
        resolver: zodResolver(creditNoteSchema),
        defaultValues: {
            invoiceId: creditNote?.invoiceId || "",
        },
    })

    // Fonction pour calculer le total d'un item
    const calculateTotal = (quantity: number, unitPrice: number, vatRate: number) => {
        return quantity * unitPrice * (1 + vatRate / 100)
    }

    const getModificationText = (item: Item) => {
        const { originalItem, modifiedItem } = item
        const quantityDiff = originalItem.quantity - modifiedItem.quantity
        const priceDiff = originalItem.unitPrice - modifiedItem.unitPrice
        const totalDiff = originalItem.total - modifiedItem.total

        if (quantityDiff > 0 && priceDiff === 0) {
            return quantityDiff === 1
                ? t("credit-notes.upsert.form.items.modification.quantityDiscounted.single")
                : t("credit-notes.upsert.form.items.modification.quantityDiscounted.multiple", { count: quantityDiff })
        }

        if (priceDiff > 0 && quantityDiff === 0) {
            return t("credit-notes.upsert.form.items.modification.priceDiscount", {
                price: priceDiff.toFixed(2),
                quantity: modifiedItem.quantity,
                quantityText:
                    modifiedItem.quantity === 1
                        ? t("credit-notes.upsert.form.items.quantity.single")
                        : t("credit-notes.upsert.form.items.quantity.multiple"),
            })
        }

        if (quantityDiff > 0 && priceDiff > 0) {
            return t("credit-notes.upsert.form.items.modification.combined", {
                quantityDiff,
                quantityText:
                    quantityDiff === 1
                        ? t("credit-notes.upsert.form.items.quantity.single")
                        : t("credit-notes.upsert.form.items.quantity.multiple"),
                price: priceDiff.toFixed(2),
            })
        }

        return t("credit-notes.upsert.form.items.modification.totalDiscount", { total: totalDiff.toFixed(2) })
    }

    useEffect(() => {
        if (isEdit && creditNote) {
            form.reset({
                invoiceId: creditNote.invoiceId || "",
            })

            const mappedItems = creditNote.items.map((item) => {
                const originalInvoiceItem = creditNote.invoice?.items.find((invItem) => invItem.id === item.invoiceItemId)
                return {
                    invoiceItemId: item.invoiceItemId,
                    originalItem: {
                        description: originalInvoiceItem?.description || "",
                        quantity: originalInvoiceItem?.quantity || 0,
                        unitPrice: originalInvoiceItem?.unitPrice || 0,
                        vatRate: originalInvoiceItem?.vatRate || 0,
                        total: calculateTotal(
                            originalInvoiceItem?.quantity || 0,
                            originalInvoiceItem?.unitPrice || 0,
                            originalInvoiceItem?.vatRate || 0,
                        ),
                    },
                    modifiedItem: {
                        description: originalInvoiceItem?.description || "",
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        vatRate: item.vatRate || 0,
                        total: calculateTotal(item.quantity, item.unitPrice, item.vatRate || 0),
                    },
                }
            })

            setItems(mappedItems)
            setSelectedInvoice(creditNote.invoice || null)
            setSelectedItem(null)
        } else {
            form.reset({
                invoiceId: "",
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
            items: items.map((item) => ({
                invoiceItemId: item.invoiceItemId,
                invoiceId: selectedInvoice?.id || "",
                quantity: item.modifiedItem.quantity,
                unitPrice: item.modifiedItem.unitPrice,
                vatRate: item.modifiedItem.vatRate,
                amountPaid: item.modifiedItem.total,
            })),
        })
            .then(() => {
                onOpenChange(false)
                form.reset()
            })
            .catch((err) => console.error(err))
    }

    const onAddItem = () => {
        if (selectedItem) {
            const newItem: Item = {
                invoiceItemId: selectedItem.id,
                originalItem: {
                    description: selectedItem.description,
                    quantity: selectedItem.quantity || 0,
                    unitPrice: selectedItem.unitPrice || 0,
                    vatRate: selectedItem.vatRate || 0,
                    total: calculateTotal(selectedItem.quantity || 0, selectedItem.unitPrice || 0, selectedItem.vatRate || 0),
                },
                modifiedItem: {
                    description: selectedItem.description,
                    quantity: selectedItem.quantity || 0,
                    unitPrice: selectedItem.unitPrice || 0,
                    vatRate: selectedItem.vatRate || 0,
                    total: calculateTotal(selectedItem.quantity || 0, selectedItem.unitPrice || 0, selectedItem.vatRate || 0),
                },
            }
            setItems([...items, newItem])
            setSelectedItem(null)
        }
    }

    const onRemoveItem = (index: number) => {
        setItems((items || []).filter((_, i) => i !== index))
    }

    const onEditItem = (index: number, field: keyof Item["modifiedItem"], value: any) => {
        setItems(
            items.map((item, i) => {
                if (i === index) {
                    const updatedModifiedItem = {
                        ...item.modifiedItem,
                        [field]: value,
                    }

                    // Recalculer le total
                    updatedModifiedItem.total = calculateTotal(
                        updatedModifiedItem.quantity,
                        updatedModifiedItem.unitPrice,
                        updatedModifiedItem.vatRate,
                    )

                    return {
                        ...item,
                        modifiedItem: updatedModifiedItem,
                    }
                }
                return item
            }),
        )
    }

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="max-w-sm lg:max-w-6xl min-w-fit max-h-[90vh] overflow-y-auto overflow-visible">
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
                                                options={(invoices || []).map((invoice) => ({
                                                    label: invoice.rawNumber || invoice.number.toString(),
                                                    value: invoice.id,
                                                }))}
                                                value={field.value ?? ""}
                                                onValueChange={(val) => {
                                                    field.onChange(val || null)
                                                    setSelectedInvoice(invoices?.find((inv) => inv.id === val) || null)
                                                    setSelectedItem(null)
                                                }}
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
                                                    .filter((item) => !items.some((i) => i.invoiceItemId === item.id))
                                                    .map((item) => ({ label: item.description, value: item.id }))}
                                                value={selectedItem?.id || undefined}
                                                onValueChange={(val) => {
                                                    setSelectedItem((selectedInvoice?.items || []).find((item) => item.id === val) || null)
                                                }}
                                                onSearchChange={setSearchTerm}
                                                placeholder={t("credit-notes.upsert.form.items.placeholder")}
                                                noResultsText={t("credit-notes.upsert.form.items.noResults")}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    <Button type="button" variant="outline" disabled={!selectedItem} onClick={onAddItem}>
                                        {t("credit-notes.upsert.form.items.addButton")}
                                    </Button>
                                </section>

                                <div className="flex flex-col gap-4">
                                    {items.map((item, index) => (
                                        <div key={index} className="border rounded-lg p-4">
                                            {/* Item original */}
                                            <div className="mb-2">
                                                <h4 className="text-sm font-medium mb-2">{t("credit-notes.upsert.form.items.originalItem")}</h4>
                                                <div className="grid grid-cols-5 gap-2 items-center">
                                                    <FormItem>
                                                        <FormControl>
                                                            <BetterInput
                                                                defaultValue={item.originalItem.description}
                                                                placeholder={t("credit-notes.upsert.form.items.description.placeholder")}
                                                                disabled
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                    <FormItem>
                                                        <FormControl>
                                                            <BetterInput
                                                                defaultValue={item.originalItem.quantity.toString()}
                                                                postAdornment={t("credit-notes.upsert.form.items.quantity.unit")}
                                                                disabled
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                    <FormItem>
                                                        <FormControl>
                                                            <BetterInput
                                                                defaultValue={item.originalItem.unitPrice.toString()}
                                                                postAdornment={selectedInvoice?.currency || "€"}
                                                                disabled
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                    <FormItem>
                                                        <FormControl>
                                                            <BetterInput
                                                                defaultValue={item.originalItem.vatRate.toString()}
                                                                postAdornment="%"
                                                                disabled
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                    <FormItem>
                                                        <FormControl>
                                                            <BetterInput
                                                                defaultValue={item.originalItem.total.toFixed(2)}
                                                                postAdornment={selectedInvoice?.currency || "€"}
                                                                disabled
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                </div>
                                            </div>

                                            {/* Flèche vers le bas */}
                                            <div className="flex justify-center my-2">
                                                <ArrowDown className="h-4 w-4" />
                                            </div>

                                            {/* Item modifié */}
                                            <div className="mb-2">
                                                <h4 className="text-sm font-medium mb-2">
                                                    {t("credit-notes.upsert.form.items.creditNoteItem")}
                                                </h4>
                                                <div className="grid grid-cols-6 gap-2 items-center">
                                                    <FormItem>
                                                        <FormControl>
                                                            <BetterInput
                                                                defaultValue={item.modifiedItem.description}
                                                                placeholder={t("credit-notes.upsert.form.items.description.placeholder")}
                                                                disabled
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                    <FormItem>
                                                        <FormControl>
                                                            <BetterInput
                                                                defaultValue={item.modifiedItem.quantity.toString()}
                                                                postAdornment={t("credit-notes.upsert.form.items.quantity.unit")}
                                                                type="number"
                                                                onChange={(e) =>
                                                                    onEditItem(index, "quantity", e.target.value === "" ? 0 : Number(e.target.value))
                                                                }
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                    <FormItem>
                                                        <FormControl>
                                                            <BetterInput
                                                                defaultValue={item.modifiedItem.unitPrice.toString()}
                                                                postAdornment={selectedInvoice?.currency || "€"}
                                                                type="number"
                                                                step="0.01"
                                                                onChange={(e) =>
                                                                    onEditItem(
                                                                        index,
                                                                        "unitPrice",
                                                                        e.target.value === "" ? 0 : Number(e.target.value.replace(",", ".")),
                                                                    )
                                                                }
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                    <FormItem>
                                                        <FormControl>
                                                            <BetterInput
                                                                defaultValue={item.modifiedItem.vatRate.toString()}
                                                                postAdornment="%"
                                                                type="number"
                                                                step="0.01"
                                                                onChange={(e) =>
                                                                    onEditItem(
                                                                        index,
                                                                        "vatRate",
                                                                        e.target.value === "" ? 0 : Number(e.target.value.replace(",", ".")),
                                                                    )
                                                                }
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                    <FormItem>
                                                        <FormControl>
                                                            <BetterInput
                                                                defaultValue={item.modifiedItem.total.toFixed(2)}
                                                                postAdornment={selectedInvoice?.currency || "€"}
                                                                disabled
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                    <Button variant="outline" onClick={() => onRemoveItem(index)} type="button" className="h-8">
                                                        <Trash2 className="h-4 w-4 text-red-700" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Texte de modification */}
                                            <div className="mt-3 p-2 rounded text-sm">
                                                <strong>{t("credit-notes.upsert.form.items.modification.label")}:</strong>{" "}
                                                {getModificationText(item)}
                                            </div>
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
            <ClientUpsert open={clientDialogOpen} onOpenChange={setClientDialogOpen} />
        </>
    )
}
