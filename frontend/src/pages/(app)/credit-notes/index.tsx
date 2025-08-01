import { Card, CardContent } from "@/components/ui/card"
import { Plus, FileX, Search } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useGet, useGetRaw } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CreditNote } from "@/types"
import { useTranslation } from "react-i18next"
import { CreditNoteList, type CreditNoteListHandle } from "./_components/credit-notes-list"

export default function CreditNotes() {
    const { t } = useTranslation()
    const receiptListRef = useRef<CreditNoteListHandle>(null)
    const [page, setPage] = useState(1)
    const { data: creditNotes, mutate, loading } = useGet<{ pageCount: number; creditNotes: CreditNote[] }>(`/api/credit-notes?page=${page}`)
    const [downloadCreditNotePdf, setDownloadCreditNotePdf] = useState<CreditNote | null>(null)
    const { data: pdf } = useGetRaw<Response>(`/api/credit-notes/${downloadCreditNotePdf?.id}/pdf`)

    useEffect(() => {
        if (downloadCreditNotePdf && pdf) {
            pdf.arrayBuffer().then((buffer) => {
                const blob = new Blob([buffer], { type: "application/pdf" })
                const url = URL.createObjectURL(blob)
                const link = document.createElement("a")
                link.href = url
                link.download = `receipt-${downloadCreditNotePdf.number}.pdf`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
                setDownloadCreditNotePdf(null) // Reset after download
            })
        }
    }, [downloadCreditNotePdf, pdf])

    const [searchTerm, setSearchTerm] = useState("")

    const filteredCreditNotes =
        creditNotes?.creditNotes.filter(
            (receipt) =>
                receipt.invoice?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                receipt.invoice?.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                receipt.rawNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                receipt.number?.toString().includes(searchTerm) ||
                receipt.invoice?.rawNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                receipt.invoice?.number?.toString().includes(searchTerm)
        ) || []

    const emptyState = (
        <div className="text-center py-12">
            <FileX className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-foreground">
                {searchTerm ? t("credit-notes.emptyState.noResults") : t("credit-notes.emptyState.noCreditNotes")}
            </h3>
            <p className="mt-1 text-sm text-primary">
                {searchTerm ? t("credit-notes.emptyState.tryDifferentSearch") : t("credit-notes.emptyState.startAdding")}
            </p>
            {!searchTerm && (
                <div className="mt-6">
                    <Button onClick={() => receiptListRef.current?.handleAddClick()}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t("credit-notes.actions.addNew")}
                    </Button>
                </div>
            )}
        </div>
    )

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-0 lg:justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <FileX className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <div className="text-sm text-primary">{t("credit-notes.header.subtitle")}</div>
                        <div className="font-medium text-foreground">
                            {t("credit-notes.header.count", {
                                count: filteredCreditNotes.length,
                                found: searchTerm ? t("credit-notes.header.found") : "",
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex flex-row items-center gap-4 w-full lg:w-fit lg:gap-6 lg:justify-between">
                    <div className="relative w-full lg:w-fit">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder={t("credit-notes.search.placeholder")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full"
                        />
                    </div>
                    <Button onClick={() => receiptListRef.current?.handleAddClick()}>
                        <Plus className="h-4 w-4 mr-0 md:mr-2" />
                        <span className="hidden md:inline-flex">{t("credit-notes.actions.addNew")}</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                    <CardContent>
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <FileX className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-foreground">{creditNotes?.creditNotes.length || 0}</p>
                                <p className="text-sm text-primary">{t("credit-notes.stats.total")}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <CreditNoteList
                ref={receiptListRef}
                creditNotes={filteredCreditNotes}
                loading={loading}
                title={t("credit-notes.list.title")}
                description={t("credit-notes.list.description")}
                page={page}
                pageCount={creditNotes?.pageCount || 1}
                setPage={setPage}
                mutate={mutate}
                emptyState={emptyState}
                showCreateButton={true}
            />
        </div>
    )
}
