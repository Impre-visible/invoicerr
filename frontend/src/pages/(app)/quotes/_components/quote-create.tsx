import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DndContext, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { GripVertical, Plus, Trash2 } from "lucide-react"
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useEffect, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { useGet, usePost } from "@/lib/utils"

import { BetterInput } from "@/components/better-input"
import { Button } from "@/components/ui/button"
import { CSS } from "@dnd-kit/utilities"
import type { Client } from "@/types"
import { DatePicker } from "@/components/date-picker"
import { Input } from "@/components/ui/input"
import type React from "react"
import SearchSelect from "@/components/search-input"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

interface QuoteCreateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function QuoteCreate({ open, onOpenChange }: QuoteCreateDialogProps) {
    const { t } = useTranslation()

    // Move schema inside component to access t function
    const quoteSchema = z.object({
        title: z.string().optional(),
        clientId: z
            .string()
            .min(1, t("quotes.create.form.client.errors.required"))
            .refine((val) => val !== "", {
                message: t("quotes.create.form.client.errors.required"),
            }),
        validUntil: z.date().optional(),
        items: z.array(
            z.object({
                description: z
                    .string()
                    .min(1, t("quotes.create.form.items.description.errors.required"))
                    .refine((val) => val !== "", {
                        message: t("quotes.create.form.items.description.errors.required"),
                    }),
                quantity: z
                    .number({ invalid_type_error: t("quotes.create.form.items.quantity.errors.required") })
                    .min(1, t("quotes.create.form.items.quantity.errors.min"))
                    .refine((val) => !isNaN(val), {
                        message: t("quotes.create.form.items.quantity.errors.invalid"),
                    }),
                unitPrice: z
                    .number({ invalid_type_error: t("quotes.create.form.items.unitPrice.errors.required") })
                    .min(0, t("quotes.create.form.items.unitPrice.errors.min"))
                    .refine((val) => !isNaN(val), {
                        message: t("quotes.create.form.items.unitPrice.errors.invalid"),
                    }),
                vatRate: z
                    .number({ invalid_type_error: t("quotes.create.form.items.vatRate.errors.required") })
                    .min(0, t("quotes.create.form.items.vatRate.errors.min")),
                order: z.number(),
            }),
        ),
    })

    const [searchTerm, setSearchTerm] = useState("")
    const { data: clients } = useGet<Client[]>(`/api/clients/search?query=${searchTerm}`)
    const { trigger } = usePost("/api/quotes")

    const form = useForm<z.infer<typeof quoteSchema>>({
        resolver: zodResolver(quoteSchema),
        defaultValues: {
            title: "",
            clientId: "",
            validUntil: undefined,
            items: [],
        },
    })

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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl min-w-fit">
                <DialogHeader>
                    <DialogTitle>{t("quotes.create.title")}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("quotes.create.form.title.label")}</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder={t("quotes.create.form.title.placeholder")} />
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
                                    <FormLabel required>{t("quotes.create.form.client.label")}</FormLabel>
                                    <FormControl>
                                        <SearchSelect
                                            options={(clients || []).map((c) => ({ label: c.name, value: c.id }))}
                                            value={field.value ?? ""}
                                            onValueChange={(val) => field.onChange(val || null)}
                                            onSearchChange={setSearchTerm}
                                            placeholder={t("quotes.create.form.client.placeholder")}
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
                                    <FormLabel>{t("quotes.create.form.validUntil.label")}</FormLabel>
                                    <FormControl>
                                        <DatePicker
                                            className="w-full"
                                            value={field.value || null}
                                            onChange={field.onChange}
                                            placeholder={t("quotes.create.form.validUntil.placeholder")}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormItem>
                            <FormLabel>{t("quotes.create.form.items.label")}</FormLabel>
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
                                                                    <Input
                                                                        {...field}
                                                                        placeholder={t("quotes.create.form.items.description.placeholder")}
                                                                    />
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
                                                                        postAdornment={t("quotes.create.form.items.quantity.unit")}
                                                                        {...field}
                                                                        type="number"
                                                                        placeholder={t("quotes.create.form.items.quantity.placeholder")}
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
                                                                        postAdornment="$"
                                                                        type="number"
                                                                        placeholder={t("quotes.create.form.items.unitPrice.placeholder")}
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
                                                                        postAdornment="%"
                                                                        type="number"
                                                                        step="0.01"
                                                                        placeholder={t("quotes.create.form.items.vatRate.placeholder")}
                                                                        onChange={(e) =>
                                                                            field.onChange(
                                                                                e.target.value === "" ? undefined : Number.parseFloat(e.target.value),
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
                                {t("quotes.create.form.items.addItem")}
                            </Button>
                        </FormItem>

                        <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                {t("quotes.create.actions.cancel")}
                            </Button>
                            <Button type="submit">{t("quotes.create.actions.create")}</Button>
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
