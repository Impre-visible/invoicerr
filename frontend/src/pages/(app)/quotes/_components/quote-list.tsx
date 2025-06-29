import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Edit, Eye, FileText, Plus, Trash2 } from "lucide-react"
import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { useGetRaw, usePost } from "@/lib/utils"

import BetterPagination from "../../../../components/pagination"
import { Button } from "../../../../components/ui/button"
import type { Quote } from "@/types"
import { QuoteCreate } from "@/pages/(app)/quotes/_components/quote-create"
import { QuoteDeleteDialog } from "@/pages/(app)/quotes/_components/quote-delete"
import { QuoteEdit } from "@/pages/(app)/quotes/_components/quote-edit"
import { QuotePdfModal } from "@/pages/(app)/quotes/_components/quote-pdf-view"
import { QuoteViewDialog } from "@/pages/(app)/quotes/_components/quote-view"
import { toast } from "sonner"

interface QuoteListProps {
    quotes: Quote[]
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

export interface QuoteListHandle {
    handleAddClick: () => void;
}

export const QuoteList = forwardRef<QuoteListHandle, QuoteListProps>(({
    quotes,
    loading,
    title,
    description,
    page,
    pageCount,
    setPage,
    mutate,
    emptyState,
    showCreateButton = false
}, ref) => {
    const { trigger: triggerSendForSignature } = usePost<{ message: string, signature: { id: string } }>(`/api/signatures`)
    const { trigger: triggerCreateInvoice } = usePost(`/api/invoices/create-from-quote`)

    const [createQuoteDialog, setCreateQuoteDialog] = useState<boolean>(false)
    const [editQuoteDialog, setEditQuoteDialog] = useState<Quote | null>(null)
    const [viewQuoteDialog, setViewQuoteDialog] = useState<Quote | null>(null)
    const [viewQuotePdfDialog, setViewQuotePdfDialog] = useState<Quote | null>(null)
    const [deleteQuoteDialog, setDeleteQuoteDialog] = useState<Quote | null>(null)
    const [downloadQuotePdf, setDownloadQuotePdf] = useState<Quote | null>(null)

    const { data: pdf } = useGetRaw<Response>(`/api/quotes/${downloadQuotePdf?.id}/pdf`)

    useImperativeHandle(ref, () => ({
        handleAddClick() {
            setCreateQuoteDialog(true)
        }
    }));

    useEffect(() => {
        if (downloadQuotePdf && pdf) {
            pdf.arrayBuffer().then((buffer) => {
                const blob = new Blob([buffer], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `quote-${downloadQuotePdf.number}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                setDownloadQuotePdf(null); // Reset after download
            });
        }
    }, [downloadQuotePdf, pdf]);

    function handleAddClick() {
        setCreateQuoteDialog(true)
    }

    function handleEdit(quote: Quote) {
        setEditQuoteDialog(quote)
    }

    function handleView(quote: Quote) {
        setViewQuoteDialog(quote)
    }

    function handleViewPdf(quote: Quote) {
        setViewQuotePdfDialog(quote)
    }

    function handleDownloadPdf(quote: Quote) {
        setDownloadQuotePdf(quote)
    }

    function handleDelete(quote: Quote) {
        setDeleteQuoteDialog(quote)
    }

    function handleSendForSignature(quoteId: string) {
        triggerSendForSignature({ quoteId: quoteId }).then((data) => {
            if (!data || !data.signature) {
                toast.error("Failed to send quote for signature.");
                return;
            }

            toast.success(data.message);

            mutate();
        }).catch((error) => {
            console.error("Error sending quote for signature:", error);
        });
    }

    function handleCreateInvoice(quoteId: string) {
        triggerCreateInvoice({ quoteId }).then(() => {
            toast.success("Invoice created successfully!");
            mutate();
        }).catch((error) => {
            console.error("Error creating invoice from quote:", error);
            toast.error("Failed to create invoice from quote.");
        });
    }

    return (
        <>
            <Card className="gap-0">
                <CardHeader className="border-b flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 " />
                            <span>{title}</span>
                        </CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    {showCreateButton && (
                        <Button
                            onClick={handleAddClick}
                        >
                            <Plus className="h-4 w-4 mr-0 md:mr-2" />
                            <span className="hidden md:inline-flex">
                                Add New Quote
                            </span>
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                        </div>
                    )}
                    {!loading && quotes.length === 0 ? (
                        emptyState
                    ) : (
                        <div className="divide-y">
                            {quotes.map((quote, index) => (
                                <div key={index} className="p-4 sm:p-6">
                                    <div className="flex flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex flex-row items-center gap-4 w-full">
                                            <div className="p-2 bg-blue-100 rounded-lg mb-4 md:mb-0 w-fit h-fit">
                                                <FileText className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-medium text-foreground break-words">
                                                        Quote #{quote.number} - {quote.title}
                                                    </h3>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                                                        ${quote.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                                                            quote.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                                                                quote.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                                                                    quote.status === 'SIGNED' ? 'bg-green-100 text-green-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {quote.status}
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                                                        <span><span className="font-medium text-foreground">Client:</span> {quote.client.name}</span>
                                                        <span><span className="font-medium text-foreground">Issued:</span> {new Date(quote.createdAt).toLocaleDateString()}</span>
                                                        {quote.validUntil && <span><span className="font-medium text-foreground">Valid until:</span> {new Date(quote.validUntil).toLocaleDateString()}</span>}
                                                        <span><span className="font-medium text-foreground">Total HT:</span> {quote.totalHT.toFixed(2)} €</span>
                                                        <span><span className="font-medium text-foreground">Total TTC:</span> {quote.totalTTC.toFixed(2)} €</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 lg:flex justify-start sm:justify-end gap-2">
                                            <Button
                                                tooltip="View Quote"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleView(quote)}
                                                className="text-gray-600 hover:text-blue-600"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                tooltip="View PDF"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleViewPdf(quote)}
                                                className="text-gray-600 hover:text-pink-600"
                                            >
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                tooltip="Download PDF"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDownloadPdf(quote)}
                                                className="text-gray-600 hover:text-amber-600"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            {quote.status !== 'SIGNED' && (
                                                <Button
                                                    tooltip="Edit Quote"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(quote)}
                                                    className="text-gray-600 hover:text-green-600"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {quote.status !== 'SIGNED' && (
                                                <Button
                                                    tooltip={quote.status !== "SENT" ? "Send for Signature" : "Resend Signature Request"}
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleSendForSignature(quote.id)}
                                                    className="text-gray-600 hover:text-blue-600"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {quote.status === 'SIGNED' && (
                                                <Button
                                                    tooltip="Create Invoice"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleCreateInvoice(quote.id)}
                                                    className="text-gray-600 hover:text-green-600"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {quote.status !== 'SIGNED' && (
                                                <Button
                                                    tooltip="Delete Quote"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(quote)}
                                                    className="text-gray-600 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
                {page && pageCount && setPage && (
                    <CardFooter>
                        {!loading && quotes.length > 0 && (
                            <BetterPagination pageCount={pageCount} page={page} setPage={setPage} />
                        )}
                    </CardFooter>
                )}
            </Card>

            <QuoteCreate
                open={createQuoteDialog}
                onOpenChange={(open) => { setCreateQuoteDialog(open); if (!open) mutate() }}
            />

            <QuoteEdit
                quote={editQuoteDialog}
                onOpenChange={(open) => { if (!open) setEditQuoteDialog(null); mutate() }}
            />

            <QuoteViewDialog
                quote={viewQuoteDialog}
                onOpenChange={(open) => { if (!open) setViewQuoteDialog(null) }}
            />

            <QuotePdfModal
                quote={viewQuotePdfDialog}
                onOpenChange={(open) => { if (!open) setViewQuotePdfDialog(null) }}
            />

            <QuoteDeleteDialog
                quote={deleteQuoteDialog}
                onOpenChange={(open: boolean) => { if (!open) setDeleteQuoteDialog(null); mutate() }}
            />
        </>
    )
})
