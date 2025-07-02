import type { Client, Quote } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DndContext, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { GripVertical, Plus, Trash2 } from "lucide-react"
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useEffect, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { useGet, usePatch } from "@/lib/utils"

import { BetterInput } from "@/components/better-input"
import { Button } from "@/components/ui/button"
import { CSS } from "@dnd-kit/utilities"
import CurrencySelect from "@/components/currency-select"
import { DatePicker } from "@/components/date-picker"
import { Input } from "@/components/ui/input"
import type React from "react"
import SearchSelect from "@/components/search-input"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

interface QuoteEditDialogProps {
    quote: Quote | null
    onOpenChange: (open: boolean) => void
}

export function QuoteEdit({ quote, onOpenChange }: QuoteEditDialogProps) {
    const { t } = useTranslation()

    // Move schema inside component to access t function
    const quoteSchema = z.object({
        title: z.string().optional(),
        clientId: z
            .string()
            .min(1, t("quotes.edit.form.client.errors.required"))
            .refine((val) => val !== "", {
                message: t("quotes.edit.form.client.errors.required"),
            }),
        validUntil: z.date().optional(),
        currency: z.string().optional(),
        items: z.array(
            z.object({
                id: z.string().optional(),
                description: z
                    .string()
                    .min(1, t("quotes.edit.form.items.description.errors.required"))
                    .refine((val) => val !== "", {
                        message: t("quotes.edit.form.items.description.errors.required"),
                    }),
                quantity: z
                    .number({ invalid_type_error: t("quotes.edit.form.items.quantity.errors.required") })
                    .min(1, t("quotes.edit.form.items.quantity.errors.min"))
                    .refine((val) => !isNaN(val), {
                        message: t("quotes.edit.form.items.quantity.errors.invalid"),
                    }),
                unitPrice: z
                    .number({ invalid_type_error: t("quotes.edit.form.items.unitPrice.errors.required") })
                    .min(0, t("quotes.edit.form.items.unitPrice.errors.min"))
                    .refine((val) => !isNaN(val), {
                        message: t("quotes.edit.form.items.unitPrice.errors.invalid"),
                    }),
                vatRate: z
                    .number({ invalid_type_error: t("quotes.edit.form.items.vatRate.errors.required") })
                    .min(0, t("quotes.edit.form.items.vatRate.errors.min")),
                order: z.number(),
            }),
        ),
    })

    const [searchTerm, setSearchTerm] = useState("")
    const { data: clients } = useGet<Client[]>(`/api/clients/search?query=${searchTerm}`)
    const { trigger } = usePatch(`/api/quotes/${quote?.id}`)

    const form = useForm<z.infer<typeof quoteSchema>>({
        resolver: zodResolver(quoteSchema),
        defaultValues: {
            title: "",
            clientId: "",
            validUntil: undefined,
            items: [],
        },
    })

    useEffect(() => {
        if (quote) {
            form.reset({
                title: quote.title || "",
                clientId: quote.clientId || "",
                validUntil: quote.validUntil ? new Date(quote.validUntil) : undefined,
                currency: quote.currency,
                items: quote.items
                    .sort((a, b) => a.order - b.order)
                    .map((item) => ({
                        id: item.id,
                        description: item.description || "",
                        quantity: item.quantity || 1,
                        unitPrice: item.unitPrice || 0,
                        vatRate: item.vatRate || 0,
                        order: item.order || 0,
                    })),
            })
        }
    }, [quote, form])

    const { control, handleSubmit, setValue } = form
    const { fields, append, move, remove } = useFieldArray({
        control,
        name: "items",
    })

    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor))

    const onDragEnd = (event: any) => {
        const { active, over } = event

        if (active.id !== over?.id) {
            const oldIndex = fields.findIndex((f) => f.id === active.id)
            const newIndex = fields.findIndex((f) => f.id === over.id)

            move(oldIndex, newIndex)

            const reordered = arrayMove(fields, oldIndex, newIndex)
            reordered.forEach((_, index) => {
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

    const onSubmit = (data: z.infer<typeof quoteSchema>) => {
        console.debug("Submitting quote data:", data)
        trigger(data)
            .then(() => {
                onOpenChange(false)
                form.reset()
            })
            .catch((err) => console.error(err))
    }

    return (
        <Dialog open={!!quote} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl min-w-fit">
                <DialogHeader>
                    <DialogTitle>{t("quotes.edit.title")}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("quotes.edit.form.title.label")}</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder={t("quotes.edit.form.title.placeholder")} />
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
                                    <FormLabel required>{t("quotes.edit.form.client.label")}</FormLabel>
                                    <FormControl>
                                        <SearchSelect
                                            options={(clients || []).map((c) => ({ label: c.name, value: c.id }))}
                                            value={field.value ?? ""}
                                            onValueChange={(val) => field.onChange(val || null)}
                                            onSearchChange={setSearchTerm}
                                            placeholder={t("quotes.edit.form.client.placeholder")}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("quotes.create.form.currency.label")}</FormLabel>
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
                            control={control}
                            name="validUntil"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("quotes.edit.form.validUntil.label")}</FormLabel>
                                    <FormControl>
                                        <DatePicker
                                            className="w-full"
                                            value={field.value || null}
                                            onChange={field.onChange}
                                            placeholder={t("quotes.edit.form.validUntil.placeholder")}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormItem>
                            <FormLabel>{t("quotes.edit.form.items.label")}</FormLabel>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                                <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2">
                                        {fields.map((fieldItem, index) => (
                                            <SortableItem
                                                key={fieldItem.id}
                                                id={fieldItem.id}
                                                dragHandle={<GripVertical className="cursor-grab text-muted-foreground" />}
                                            >
                                                <div className="flex gap-2 items-center">
                                                    <FormField
                                                        control={control}
                                                        name={`items.${index}.description`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input {...field} placeholder={t("quotes.edit.form.items.description.placeholder")} />
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
                                                                        postAdornment={t("quotes.edit.form.items.quantity.unit")}
                                                                        type="number"
                                                                        placeholder={t("quotes.edit.form.items.quantity.placeholder")}
                                                                        onChange={(e) =>
                                                                            field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                                                                        }
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
                                                                        placeholder={t("quotes.edit.form.items.unitPrice.placeholder")}
                                                                        onChange={(e) =>
                                                                            field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                                                                        }
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
                                                                        placeholder={t("quotes.edit.form.items.vatRate.placeholder")}
                                                                        onChange={(e) =>
                                                                            field.onChange(
                                                                                e.target.value === ""
                                                                                    ? undefined
                                                                                    : Number.parseFloat(e.target.value.replace(",", ".")),
                                                                            )
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
                                        quantity: Number.NaN,
                                        unitPrice: Number.NaN,
                                        vatRate: Number.NaN,
                                        order: fields.length,
                                    })
                                }
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                {t("quotes.edit.form.items.addItem")}
                            </Button>
                        </FormItem>

                        <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                {t("quotes.edit.actions.cancel")}
                            </Button>
                            <Button type="submit">{t("quotes.edit.actions.save")}</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

function SortableItem({
    id,
    children,
    dragHandle,
}: {
    id: string
    children: React.ReactNode
    dragHandle: React.ReactNode
}) {
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
