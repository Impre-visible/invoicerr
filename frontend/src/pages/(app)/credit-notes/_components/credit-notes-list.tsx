import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Edit, FileX, Mail, Plus, Trash2 } from "lucide-react"
import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { useGetRaw, usePost } from "@/lib/utils"

import BetterPagination from "../../../../components/pagination"
import { Button } from "../../../../components/ui/button"
import type { CreditNote } from "@/types"
import { CreditNoteDeleteDialog } from "@/pages/(app)/credit-notes/_components/credit-notes-delete"
import { CreditNoteUpsert } from "@/pages/(app)/credit-notes/_components/credit-notes-upsert"
import type React from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

interface CreditNoteListProps {
    creditNotes: CreditNote[]
    loading: boolean
    title: string
    description: string
    page?: number
    pageCount?: number
    setPage?: (page: number) => void
    mutate: () => void
    emptyState: React.ReactNode
    showCreateButton?: boolean
}

export interface CreditNoteListHandle {
    handleAddClick: () => void
}

export const CreditNoteList = forwardRef<CreditNoteListHandle, CreditNoteListProps>(
    (
        { creditNotes, loading, title, description, page, pageCount, setPage, mutate, emptyState, showCreateButton = false },
        ref,
    ) => {
        const { t } = useTranslation()
        const { trigger: triggerSendToClient } = usePost<{ message: string; }>(
            `/api/credit-notes/send`,
        )

        const [createCreditNoteDialog, setCreateCreditNoteDialog] = useState<boolean>(false)
        const [editCreditNoteDialog, setEditCreditNoteDialog] = useState<CreditNote | null>(null)
        const [deleteCreditNoteDialog, setDeleteCreditNoteDialog] = useState<CreditNote | null>(null)
        const [downloadCreditNotePdf, setDownloadCreditNotePdf] = useState<CreditNote | null>(null)

        const { data: pdf } = useGetRaw<Response>(`/api/credit-notes/${downloadCreditNotePdf?.id}/pdf`)

        useImperativeHandle(ref, () => ({
            handleAddClick() {
                setCreateCreditNoteDialog(true)
            },
        }))

        useEffect(() => {
            if (downloadCreditNotePdf && pdf) {
                pdf.arrayBuffer().then((buffer) => {
                    const blob = new Blob([buffer], { type: "application/pdf" })
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement("a")
                    link.href = url
                    link.download = `creditNote-${downloadCreditNotePdf.number}.pdf`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    URL.revokeObjectURL(url)
                    setDownloadCreditNotePdf(null) // Reset after download
                })
            }
        }, [downloadCreditNotePdf, pdf])

        function handleAddClick() {
            setCreateCreditNoteDialog(true)
        }

        function handleEdit(creditNote: CreditNote) {
            setEditCreditNoteDialog(creditNote)
        }

        function handleDownloadPdf(creditNote: CreditNote) {
            setDownloadCreditNotePdf(creditNote)
        }

        function handleSendToClient(creditNote: CreditNote) {
            triggerSendToClient({ id: creditNote.id })
                .then(() => {
                    toast.success(t("credit-notes.list.messages.emailSent"))
                    mutate()
                })
                .catch((error) => {
                    console.error("Error sending creditNote to client:", error)
                    toast.error(t("credit-notes.list.messages.emailError"))
                })
        }

        function handleDelete(creditNote: CreditNote) {
            setDeleteCreditNoteDialog(creditNote)
        }


        return (
            <>
                <Card className="gap-0">
                    <CardHeader className="border-b flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center space-x-2">
                                <FileX className="h-5 w-5 " />
                                <span>{title}</span>
                            </CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </div>
                        {showCreateButton && (
                            <Button onClick={handleAddClick}>
                                <Plus className="h-4 w-4 mr-0 md:mr-2" />
                                <span className="hidden md:inline-flex">{t("credit-notes.list.actions.addNew")}</span>
                            </Button>
                        )}
                    </CardHeader>

                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                            </div>
                        ) : creditNotes.length === 0 ? (
                            emptyState
                        ) : (
                            <div className="divide-y">
                                {creditNotes.map((creditNote, index) => (
                                    <div key={index} className="p-4 sm:p-6">
                                        <div className="flex flex-row sm:items-center sm:justify-between gap-4">
                                            <div className="flex flex-row items-center gap-4 w-full">
                                                <div className="p-2 bg-blue-100 rounded-lg mb-4 md:mb-0 w-fit h-fit">
                                                    <FileX className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="font-medium text-foreground break-words">
                                                            {t("credit-notes.list.item.title", { number: creditNote.rawNumber || creditNote.number })}
                                                        </h3>
                                                    </div>
                                                    <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground">
                                                        <div className="hidden sm:grid sm:grid-cols-1 lg:grid-cols-2 gap-1">
                                                            <span>
                                                                <span className="font-medium text-foreground">{t("credit-notes.list.item.invoice")}:</span>{" "}
                                                                {creditNote.invoice?.rawNumber || creditNote.invoice?.number || t("credit-notes.list.item.noInvoice")}
                                                            </span>
                                                            <span>
                                                                <span className="font-medium text-foreground">{t("credit-notes.list.item.totalItemCount")}:</span>{" "}
                                                                {creditNote.items.length}
                                                            </span>
                                                            <span>
                                                                <span className="font-medium text-foreground">{t("credit-notes.list.item.totalPaid")}:</span>{" "}
                                                                {t("common.valueWithCurrency", {
                                                                    currency: creditNote.invoice?.currency || "USD",
                                                                    amount: creditNote.items.reduce(
                                                                        (total, item) => total + item.unitPrice * item.quantity * (1 + item.vatRate / 100),
                                                                        0,
                                                                    ),
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 lg:flex justify-start sm:justify-end gap-1 md:gap-2">
                                                <Button
                                                    tooltip={t("credit-notes.list.tooltips.downloadPdf")}
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDownloadPdf(creditNote)}
                                                    className="text-gray-600 hover:text-amber-600"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    tooltip={t("credit-notes.list.tooltips.edit")}
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(creditNote)}
                                                    className="text-gray-600 hover:text-green-600"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    tooltip={t("credit-notes.list.tooltips.sendToClient")}
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleSendToClient(creditNote)}
                                                    className="text-gray-600 hover:text-blue-600"
                                                >
                                                    <Mail className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    tooltip={t("credit-notes.list.tooltips.delete")}
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(creditNote)}
                                                    className="text-gray-600 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>

                    {page && pageCount && setPage && (
                        <CardFooter>
                            {!loading && creditNotes.length > 0 && (
                                <BetterPagination pageCount={pageCount} page={page} setPage={setPage} />
                            )}
                        </CardFooter>
                    )}
                </Card>

                <CreditNoteUpsert
                    open={createCreditNoteDialog}
                    onOpenChange={(open) => {
                        setCreateCreditNoteDialog(open)
                        if (!open) mutate()
                    }}
                />

                <CreditNoteUpsert
                    open={!!editCreditNoteDialog}
                    creditNote={editCreditNoteDialog}
                    onOpenChange={(open) => {
                        if (!open) setEditCreditNoteDialog(null)
                        mutate()
                    }}
                />

                <CreditNoteDeleteDialog
                    creditNote={deleteCreditNoteDialog}
                    onOpenChange={(open: boolean) => {
                        if (!open) setDeleteCreditNoteDialog(null)
                        mutate()
                    }}
                />
            </>
        )
    },
)
