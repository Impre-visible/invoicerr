import { Banknote, Download, Edit, Eye, FileSignature, FileText, Plus, Search, Signature, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useGet, useGetRaw, usePost } from "@/lib/utils"

import BetterPagination from "@/components/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Invoice } from "@/types"
import { InvoiceCreate } from "./_components/invoice-create"
import { InvoiceDeleteDialog } from "./_components/invoice-delete"
import { InvoiceEdit } from "./_components/invoice-edit"
import { InvoicePdfModal } from "./_components/invoice-pdf-view"
import { InvoiceViewDialog } from "./_components/invoice-view"

export default function Invoices() {
    const { trigger: triggerMarkAsSigned } = usePost(`/api/invoices/mark-as-signed`)
    const { trigger: triggerCreateInvoice } = usePost(`/api/invoices/create-from-invoice`)

    const [page, setPage] = useState(1)

    const { data: invoices, mutate, loading } = useGet<{ pageCount: number, invoices: Invoice[] }>(`/api/invoices?page=${page}`)

    const [createInvoiceDialog, setCreateInvoiceDialog] = useState<boolean>(false)
    const [editInvoiceDialog, setEditInvoiceDialog] = useState<Invoice | null>(null)
    const [viewInvoiceDialog, setViewInvoiceDialog] = useState<Invoice | null>(null)
    const [viewInvoicePdfDialog, setViewInvoicePdfDialog] = useState<Invoice | null>(null)
    const [deleteInvoiceDialog, setDeleteInvoiceDialog] = useState<Invoice | null>(null)
    const [downloadInvoicePdf, setDownloadInvoicePdf] = useState<Invoice | null>(null)

    const { data: pdf } = useGetRaw<Response>(`/api/invoices/${downloadInvoicePdf?.id}/pdf`)

    useEffect(() => {
        if (downloadInvoicePdf && pdf) {
            pdf.arrayBuffer().then((buffer) => {
                const blob = new Blob([buffer], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `invoice-${downloadInvoicePdf.number}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                setDownloadInvoicePdf(null); // Reset after download
            });
        }
    }, [downloadInvoicePdf, pdf]);

    const [searchTerm, setSearchTerm] = useState("")

    const filteredInvoices = invoices?.invoices.filter(invoice =>
        invoice.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.status.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    function handleAddClick() {
        setCreateInvoiceDialog(true)
    }

    function handleEdit(invoice: Invoice) {
        setEditInvoiceDialog(invoice)
    }

    function handleView(invoice: Invoice) {
        setViewInvoiceDialog(invoice)
    }

    function handleViewPdf(invoice: Invoice) {
        setViewInvoicePdfDialog(invoice)
    }

    function handleDownloadPdf(invoice: Invoice) {
        setDownloadInvoicePdf(invoice)
    }

    function handleDelete(invoice: Invoice) {
        setDeleteInvoiceDialog(invoice)
    }

    function handleMarkAsSigned(invoiceId: string) {
        triggerMarkAsSigned({ id: invoiceId }).then(() => {
            mutate();
        }).catch((error) => {
            console.error("Error marking invoice as signed:", error);
        });
    }

    function handleCreateInvoice(invoiceId: string) {
        triggerCreateInvoice({ invoiceId })
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-0 lg:justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <FileSignature className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <div className="text-sm text-primary">Manage your invoices</div>
                        <div className="font-medium text-foreground">
                            {filteredInvoices.length} invoice{filteredInvoices.length > 1 ? 's' : ''}
                            {searchTerm && ` trouvé${filteredInvoices.length > 1 ? 's' : ''}`}
                        </div>
                    </div>
                </div>

                <div className="flex flex-row items-center gap-4 w-full lg:w-fit lg:gap-6 lg:justify-between">
                    <div className="relative w-full lg:w-fit">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search invoices..."
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
                            Add New Invoice
                        </span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                    <CardContent>
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <FileSignature className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-foreground">{invoices?.invoices.length || 0}</p>
                                <p className="text-sm text-primary">Total Invoices</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <div className="w-6 h-6 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                </div>
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-foreground">
                                    {invoices?.invoices.filter(c => c.status === "SENT").length || 0}
                                </p>
                                <p className="text-sm text-primary">Sent Invoices</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <div className="w-6 h-6 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                </div>
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-foreground">
                                    {invoices?.invoices.filter(c => c.status === "PAID").length || 0}
                                </p>
                                <p className="text-sm text-primary">Paid Invoices</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="gap-0">
                <CardHeader className="border-b">
                    <CardTitle className="flex items-center space-x-2">
                        <FileSignature className="h-5 w-5 " />
                        <span>Invoices</span>
                    </CardTitle>
                    <CardDescription>Manage your invoices, view details, edit or delete them.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                        </div>
                    )}
                    {!loading && filteredInvoices.length === 0 ? (
                        <div className="text-center py-12">
                            <FileSignature className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-foreground">
                                {searchTerm ? 'No invoices found' : 'No invoices added yet'}
                            </h3>
                            <p className="mt-1 text-sm text-primary">
                                {searchTerm
                                    ? 'Try a different search term'
                                    : 'Start adding invoices to manage your business effectively.'
                                }
                            </p>
                            {!searchTerm && (
                                <div className="mt-6">
                                    <Button onClick={handleAddClick}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add New Invoice
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredInvoices.map((invoice, index) => (
                                <div key={index} className="p-4 sm:p-6">
                                    <div className="flex flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex flex-row items-center gap-4 w-full">
                                            <div className="p-2 bg-blue-100 rounded-lg mb-4 md:mb-0 w-fit h-fit">
                                                <FileSignature className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-medium text-foreground break-words">
                                                        {invoice.title || `Invoice #${invoice.number}`}
                                                    </h3>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                                                        ${invoice.status === 'SENT' ? 'bg-yellow-100 text-yellow-800' :
                                                            invoice.status === 'UNPAID' ? 'bg-blue-100 text-blue-800' :
                                                                invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                                                                    invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {invoice.status}
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex flex-col sm:flex-row flex-wrap gap-2 text-sm text-primary">
                                                    <div className="flex items-center space-x-1">
                                                        <span className="break-all">Client: {invoice.client.name}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <span className="break-all">Total: {invoice.totalHT}{invoice.company.currency}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 lg:flex justify-start sm:justify-end gap-2">
                                            <Button
                                                tooltip="View Invoice"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleView(invoice)}
                                                className="text-gray-600 hover:text-blue-600"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                tooltip="View PDF"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleViewPdf(invoice)}
                                                className="text-gray-600 hover:text-pink-600"
                                            >
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                tooltip="Download PDF"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDownloadPdf(invoice)}
                                                className="text-gray-600 hover:text-amber-600"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                tooltip="Edit Invoice"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(invoice)}
                                                className="text-gray-600 hover:text-green-600"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            {invoice.status !== 'PAID' && (
                                                <Button
                                                    tooltip="Mark as Paid"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleMarkAsSigned(invoice.id)}
                                                    className="text-gray-600 hover:text-blue-600"
                                                >
                                                    <Banknote className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {invoice.status === 'SENT' && (
                                                <Button
                                                    tooltip="Create Invoice"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleCreateInvoice(invoice.id)}
                                                    className="text-gray-600 hover:text-green-600"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                tooltip="Delete Invoice"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(invoice)}
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
                <CardFooter>
                    {!loading && filteredInvoices.length > 0 && (
                        <BetterPagination pageCount={invoices?.pageCount || 1} page={page} setPage={setPage} />
                    )}
                </CardFooter>
            </Card>

            <InvoiceCreate
                open={createInvoiceDialog}
                onOpenChange={(open) => { setCreateInvoiceDialog(open); mutate() }}
            />

            <InvoiceEdit
                invoice={editInvoiceDialog}
                onOpenChange={(open) => { if (!open) setEditInvoiceDialog(null); mutate() }}
            />

            <InvoiceViewDialog
                invoice={viewInvoiceDialog}
                onOpenChange={(open) => { if (!open) setViewInvoiceDialog(null) }}
            />

            <InvoicePdfModal
                invoice={viewInvoicePdfDialog}
                onOpenChange={(open) => { if (!open) setViewInvoicePdfDialog(null) }}
            />

            <InvoiceDeleteDialog
                invoice={deleteInvoiceDialog}
                onOpenChange={(open) => { if (!open) setDeleteInvoiceDialog(null); mutate() }}
            />

        </div>
    )
}