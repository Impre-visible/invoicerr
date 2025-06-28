import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Edit, Eye, FileSignature, FileText, Mail, Phone, Plus, Search, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useGet, useGetRaw } from "@/lib/utils"

import BetterPagination from "@/components/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Quote } from "@/types"
import { QuoteCreate } from "./_components/quote-create"
import { QuoteDeleteDialog } from "./_components/quote-delete"
import { QuoteEdit } from "./_components/quote-edit"
import { QuotePdfModal } from "./_components/quote-pdf-view"
import { QuoteViewDialog } from "./_components/quote-view"

export default function Quotes() {
    const [page, setPage] = useState(1)

    const { data: quotes, mutate, loading } = useGet<{ pageCount: number, quotes: Quote[] }>(`/api/quotes?page=${page}`)

    const [createQuoteDialog, setCreateQuoteDialog] = useState<boolean>(false)
    const [editQuoteDialog, setEditQuoteDialog] = useState<Quote | null>(null)
    const [viewQuoteDialog, setViewQuoteDialog] = useState<Quote | null>(null)
    const [viewQuotePdfDialog, setViewQuotePdfDialog] = useState<Quote | null>(null)
    const [deleteQuoteDialog, setDeleteQuoteDialog] = useState<Quote | null>(null)
    const [downloadQuotePdf, setDownloadQuotePdf] = useState<Quote | null>(null)

    const { data: pdf } = useGetRaw<Response>(`/api/quotes/${downloadQuotePdf?.id}/pdf`)

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

    const [searchTerm, setSearchTerm] = useState("")

    const filteredQuotes = quotes?.quotes.filter(quote =>
        quote.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.status.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

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

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-0 lg:justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <FileSignature className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <div className="text-sm text-primary">Manage your quotes</div>
                        <div className="font-medium text-foreground">
                            {filteredQuotes.length} quote{filteredQuotes.length > 1 ? 's' : ''}
                            {searchTerm && ` trouvé${filteredQuotes.length > 1 ? 's' : ''}`}
                        </div>
                    </div>
                </div>

                <div className="flex flex-row items-center gap-4 w-full lg:w-fit lg:gap-6 lg:justify-between">
                    <div className="relative w-full lg:w-fit">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full"
                        />
                    </div>

                    <Button
                        onClick={handleAddClick}
                    >
                        <Plus className="h-4 w-4 mr-0 md:mr-2" />
                        <span className="hidden md:inline-flex">
                            Add New Client
                        </span>
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <FileSignature className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-foreground">{quotes?.quotes.length || 0}</p>
                                <p className="text-sm text-primary">Total Quotes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <div className="w-6 h-6 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                </div>
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-foreground">
                                    {quotes?.quotes.filter(c => c.status === "DRAFT").length || 0}
                                </p>
                                <p className="text-sm text-primary">Draft Quotes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <div className="w-6 h-6 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                </div>
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-foreground">
                                    {quotes?.quotes.filter(c => c.status === "SIGNED").length || 0}
                                </p>
                                <p className="text-sm text-primary">Signed Quotes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="gap-0">
                <CardHeader className="border-b">
                    <CardTitle className="flex items-center space-x-2">
                        <FileSignature className="h-5 w-5 " />
                        <span>Quotes</span>
                    </CardTitle>
                    <CardDescription>Manage your quotes, view details, edit or delete them.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                        </div>
                    )}
                    {!loading && filteredQuotes.length === 0 ? (
                        <div className="text-center py-12">
                            <FileSignature className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-foreground">
                                {searchTerm ? 'No quotes found' : 'No quotes added yet'}
                            </h3>
                            <p className="mt-1 text-sm text-primary">
                                {searchTerm
                                    ? 'Try a different search term'
                                    : 'Start adding quotes to manage your business effectively.'
                                }
                            </p>
                            {!searchTerm && (
                                <div className="mt-6">
                                    <Button onClick={handleAddClick}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add New Quote
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredQuotes.map((quote, index) => (
                                <div key={index} className="p-4 sm:p-6">
                                    <div className="flex flex-row sm:items-center sm:justify-between gap-4">
                                        {/* Bloc gauche */}
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-4 w-full">
                                            <div className="self-start sm:self-auto p-2 bg-blue-100 rounded-lg">
                                                <FileSignature className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-medium text-foreground break-words">
                                                        {quote.title || `Quote #${quote.number}`}
                                                    </h3>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                ${quote.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                                                            quote.status === 'SIGNED' ? 'bg-blue-100 text-blue-800' :
                                                                quote.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                                                                    quote.status === 'SENT' ? 'bg-green-100 text-green-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {quote.status}
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex flex-col sm:flex-row flex-wrap gap-2 text-sm text-primary">
                                                    <div className="flex items-center space-x-1">
                                                        <Mail className="h-4 w-4" />
                                                        <span className="break-all">{quote.client.contactEmail}</span>
                                                    </div>
                                                    {quote.client.contactPhone && (
                                                        <div className="flex items-center space-x-1">
                                                            <Phone className="h-4 w-4" />
                                                            <span>{quote.client.contactPhone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Boutons */}
                                        <div className="grid grid-cols-2 lg:flex justify-start sm:justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleView(quote)}
                                                className="text-gray-600 hover:text-blue-600"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewPdf(quote)}
                                                className="text-gray-600 hover:text-pink-600"
                                            >
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDownloadPdf(quote)}
                                                className="text-gray-600 hover:text-amber-600"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(quote)}
                                                className="text-gray-600 hover:text-green-600"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(quote)}
                                                className="text-gray-600 hover:text-red-600 col-span-2 sm:col-auto"
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
                <CardFooter>
                    {!loading && filteredQuotes.length > 0 && (
                        <BetterPagination pageCount={quotes?.pageCount || 1} page={page} setPage={setPage} />
                    )}
                </CardFooter>
            </Card>

            <QuoteCreate
                open={createQuoteDialog}
                onOpenChange={(open) => { setCreateQuoteDialog(open); mutate() }}
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
                onOpenChange={(open) => { if (!open) setDeleteQuoteDialog(null); mutate() }}
            />

        </div>
    )
}