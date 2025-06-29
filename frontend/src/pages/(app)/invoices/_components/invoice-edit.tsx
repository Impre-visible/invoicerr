import type { Client, Invoice, Quote } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    DndContext,
    MouseSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { GripVertical, Plus, Trash2 } from "lucide-react"
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useEffect, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { useGet, usePatch } from "@/lib/utils"

import { BetterInput } from "@/components/better-input"
import { Button } from "@/components/ui/button"
import { CSS } from "@dnd-kit/utilities"
import { DatePicker } from "@/components/date-picker"
import { Input } from "@/components/ui/input"
import SearchSelect from "@/components/search-input"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

interface InvoiceEditDialogProps {
    invoice: Invoice | null
    onOpenChange: (open: boolean) => void
}

const invoiceSchema = z.object({
    quoteId: z.string().min(1, "Quote ID is required").optional(),
    clientId: z.string().min(1, "Client is required").refine(val => val !== "", {
        message: "Client is required",
    }),
    dueDate: z.date().optional(),
    items: z.array(
        z.object({
            id: z.string().optional(),
            description: z.string().min(1, "Description is required").refine(val => val !== "", {
                message: "Description is required",
            }),
            quantity: z.number({ invalid_type_error: "Quantity is required" }).min(1, "Quantity must be greater than 0").refine(val => !isNaN(val), {
                message: "Quantity must be a valid number",
            }),
            unitPrice: z.number({ invalid_type_error: "Unit Price is required" }).min(0, "Unit Price must be greater than or equal to 0").refine(val => !isNaN(val), {
                message: "Unit Price must be a valid number",
            }),
            vatRate: z.number({ invalid_type_error: "VAT Rate is required" }).min(0, "VAT Rate must be greater than or equal to 0"),
            order: z.number(),
        })
    ),
})

export function InvoiceEdit({ invoice, onOpenChange }: InvoiceEditDialogProps) {
    const [clientSearchTerm, setClientsSearchTerm] = useState("")
    const [quoteSearchTerm, setQuoteSearchTerm] = useState("")

    const { data: clients } = useGet<Client[]>(`/api/clients/search?query=${clientSearchTerm}`)
    const { data: quotes } = useGet<Quote[]>(`/api/quotes/search?query=${quoteSearchTerm}`)

    const { trigger } = usePatch(`/api/invoices/${invoice?.id}`)

    const form = useForm<z.infer<typeof invoiceSchema>>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            quoteId: undefined,
            clientId: "",
            dueDate: undefined,
            items: [],
        },
    })

    useEffect(() => {
        if (invoice) {
            form.reset({
                quoteId: invoice.quoteId || "",
                clientId: invoice.clientId || "",
                dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
                items: invoice.items.sort((a, b) => a.order - b.order).map(item => ({
                    id: item.id,
                    description: item.description || "",
                    quantity: item.quantity || 1,
                    unitPrice: item.unitPrice || 0,
                    vatRate: item.vatRate || 0,
                    order: item.order || 0,
                })),
            })
        }
    }, [invoice, form])

    const { control, handleSubmit, setValue } = form
    const { fields, append, move, remove } = useFieldArray({
        control,
        name: "items",
    })

    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor))

    const onDragEnd = (event: any) => {
        const { active, over } = event
        if (active.id !== over?.id) {
            const oldIndex = fields.findIndex(f => f.id === active.id)
            const newIndex = fields.findIndex(f => f.id === over.id)
            move(oldIndex, newIndex)
            const reordered = arrayMove(fields, oldIndex, newIndex)
            reordered.forEach((_item, index) => {
                setValue(`items.${index}.order`, index)
            })
        }
    }

    useEffect(() => {
        fields.forEach((_, i) => {
            setValue(`items.${i}.order`, i)
        })
    }, [fields, setValue])

    const onRemove = (index: number) => {
        remove(index)
    }

    const onSubmit = (data: z.infer<typeof invoiceSchema>) => {
        console.debug("Submitting invoice data:", data)
        trigger(data)
            .then(() => {
                onOpenChange(false)
                form.reset()
            })
            .catch((err) => console.error(err))
    }

    return (
        <Dialog open={!!invoice} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl min-w-fit">
                <DialogHeader>
                    <DialogTitle>Edit Invoice</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={control}
                            name="quoteId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quote</FormLabel>
                                    <FormControl>
                                        <SearchSelect
                                            options={(quotes || []).map((c) => ({ label: `${c.number}${c.title ? ` (${c.title})` : ''}`, value: c.id }))}
                                            value={field.value ?? ""}
                                            onValueChange={val => { field.onChange(val || null); if (val) form.setValue("clientId", quotes?.find(q => q.id === val)?.clientId || "") }}
                                            onSearchChange={setQuoteSearchTerm}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />


                        <FormField
                            control={control}
                            name="clientId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel required>Client</FormLabel>
                                    <FormControl>
                                        <SearchSelect
                                            options={(clients || []).map((c) => ({ label: c.name, value: c.id }))}
                                            value={field.value ?? ""}
                                            onValueChange={val => field.onChange(val || null)}
                                            onSearchChange={setClientsSearchTerm}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={control}
                            name="dueDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Due Date</FormLabel>
                                    <FormControl>
                                        <DatePicker
                                            className="w-full"
                                            value={field.value || null}
                                            onChange={field.onChange}
                                            placeholder="Select a date"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormItem>
                            <FormLabel>Invoice Items</FormLabel>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                                <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2">
                                        {fields.map((fieldItem, index) => (
                                            <SortableItem key={fieldItem.id} id={fieldItem.id} dragHandle={<GripVertical className="cursor-grab text-muted-foreground" />}>
                                                <div className="flex gap-2 items-center">
                                                    <FormField
                                                        control={control}
                                                        name={`items.${index}.description`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input {...field} placeholder="Description" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={control}
                                                        name={`items.${index}.quantity`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <BetterInput
                                                                        {...field}
                                                                        defaultValue={field.value || ""}
                                                                        postAdornment="Qty"
                                                                        type="number"
                                                                        placeholder="Quantity"
                                                                        onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={control}
                                                        name={`items.${index}.unitPrice`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <BetterInput
                                                                        {...field}
                                                                        defaultValue={field.value || ""}
                                                                        postAdornment="$"
                                                                        type="number"
                                                                        placeholder="Unit Price"
                                                                        onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={control}
                                                        name={`items.${index}.vatRate`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <BetterInput
                                                                        {...field}
                                                                        defaultValue={field.value || ""}
                                                                        postAdornment="%"
                                                                        type="number"
                                                                        step="0.01"
                                                                        placeholder="VAT Rate"
                                                                        onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value.replace(',', '.')))}
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
                                            </SortableItem>
                                        ))}

                                    </div>
                                </SortableContext>
                            </DndContext>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    append({
                                        description: "",
                                        quantity: NaN,
                                        unitPrice: NaN,
                                        vatRate: NaN,
                                        order: fields.length,
                                    })
                                }
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Item
                            </Button>
                        </FormItem>

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

function SortableItem({ id, children, dragHandle }: { id: string; children: React.ReactNode; dragHandle: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2">
            {children}
            <div {...attributes} {...listeners}>
                {dragHandle}
            </div>
        </div>
    )
}
