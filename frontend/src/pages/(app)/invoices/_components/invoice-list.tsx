import { Banknote, Download, Edit, Eye, Plus, Receipt, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { useGetRaw, usePost } from "@/lib/utils"

import BetterPagination from "../../../../components/pagination"
import { Button } from "@/components/ui/button"
import type { Invoice } from "@/types"
import { InvoiceCreate } from "./invoice-create"
import { InvoiceDeleteDialog } from "./invoice-delete"
import { InvoiceEdit } from "./invoice-edit"
import { InvoicePdfModal } from "./invoice-pdf-view"
import { InvoiceViewDialog } from "./invoice-view"

interface InvoiceListProps {
    invoices: Invoice[]
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

export interface InvoiceListHandle {
    handleAddClick: () => void;
}

export const InvoiceList = forwardRef<InvoiceListHandle, InvoiceListProps>(({
    invoices,
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
    const { trigger: triggerMarkAsPaid } = usePost(`/api/invoices/mark-as-paid`)

    const [createInvoiceDialog, setCreateInvoiceDialog] = useState<boolean>(false)
    const [editInvoiceDialog, setEditInvoiceDialog] = useState<Invoice | null>(null)
    const [viewInvoiceDialog, setViewInvoiceDialog] = useState<Invoice | null>(null)
    const [viewInvoicePdfDialog, setViewInvoicePdfDialog] = useState<Invoice | null>(null)
    const [deleteInvoiceDialog, setDeleteInvoiceDialog] = useState<Invoice | null>(null)

    const [downloadTrigger, setDownloadTrigger] = useState<{ invoice: Invoice, format: string, id: number } | null>(null);

    const { data: pdf } = useGetRaw<Response>(`/api/invoices/${downloadTrigger?.invoice?.id}/pdf?format=${downloadTrigger?.format}`)

    useImperativeHandle(ref, () => ({
        handleAddClick() {
            setCreateInvoiceDialog(true)
        }
    }));

    useEffect(() => {
        if (downloadTrigger && pdf) {
            pdf.arrayBuffer().then((buffer) => {
                const blob = new Blob([buffer], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `invoice-${downloadTrigger.invoice.number}-${downloadTrigger.format || 'default'}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                setDownloadTrigger(null); // Reset
            });
        }
    }, [downloadTrigger, pdf]);

    function handleEdit(invoice: Invoice) {
        setEditInvoiceDialog(invoice)
    }

    function handleView(invoice: Invoice) {
        setViewInvoiceDialog(invoice)
    }

    function handleViewPdf(invoice: Invoice) {
        setViewInvoicePdfDialog(invoice)
    }

    function handleDelete(invoice: Invoice) {
        setDeleteInvoiceDialog(invoice)
    }

    function handleMarkAsPaid(invoiceId: string) {
        triggerMarkAsPaid({ invoiceId }).then(() => {
            mutate();
        }).catch((error) => {
            console.error("Error marking invoice as paid:", error);
        });
    }

    function handleDownloadPdf({ invoice, format }: { invoice: Invoice, format: string }) {
        setDownloadTrigger({ invoice, format, id: Date.now() });
    }

    return (
        <>
            <Card className="gap-0">
                <CardHeader className="border-b flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center space-x-2">
                            <Receipt className="h-5 w-5 " />
                            <span>{title}</span>
                        </CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    {showCreateButton && (
                        <Button
                            onClick={() => setCreateInvoiceDialog(true)}
                        >
                            <Plus className="h-4 w-4 mr-0 md:mr-2" />
                            <span className="hidden md:inline-flex">
                                Add New Invoice
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
                    {!loading && invoices.length === 0 ? (
                        emptyState
                    ) : (
                        <div className="divide-y">
                            {invoices.map((invoice, index) => (
                                <div key={index} className="p-4 sm:p-6">
                                    <div className="flex flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex flex-row items-center gap-4 w-full">
                                            <div className="p-2 bg-blue-100 rounded-lg mb-4 md:mb-0 w-fit h-fit">
                                                <Receipt className="h-5 w-5 text-blue-600" />
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
                                                <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                                                        <span><span className="font-medium text-foreground">Client:</span> {invoice.client.name}</span>
                                                        <span><span className="font-medium text-foreground">Issued:</span> {new Date(invoice.createdAt).toLocaleDateString()}</span>
                                                        <span><span className="font-medium text-foreground">Due:</span> {new Date(invoice.dueDate).toLocaleDateString()}</span>
                                                        {invoice.paymentMethod && (
                                                            <span><span className="font-medium text-foreground">Payment:</span> {invoice.paymentMethod}</span>
                                                        )}
                                                        <span><span className="font-medium text-foreground">Total HT:</span> {invoice.totalHT.toFixed(2)} €</span>
                                                        <span><span className="font-medium text-foreground">Total TTC:</span> {invoice.totalTTC.toFixed(2)} €</span>
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
                                                <Receipt className="h-4 w-4" />
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild >
                                                    <Button
                                                        tooltip="Download PDF"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-gray-600 hover:text-amber-600"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="center" className="[&>*]:cursor-pointer">
                                                    <DropdownMenuItem onClick={() => handleDownloadPdf({ invoice, format: '' })}>PDF</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDownloadPdf({ invoice, format: 'facturx' })}>Factur-X</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDownloadPdf({ invoice, format: 'zugferd' })}>ZUGFeRD</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDownloadPdf({ invoice, format: 'xrechnung' })}>XRechnung</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDownloadPdf({ invoice, format: 'ubl' })}>UBL</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDownloadPdf({ invoice, format: 'cii' })}>CII</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            {invoice.status !== 'PAID' && (
                                                <Button
                                                    tooltip="Edit Invoice"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(invoice)}
                                                    className="text-gray-600 hover:text-green-600"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {invoice.status !== 'PAID' && (
                                                <Button
                                                    tooltip="Mark as Paid"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleMarkAsPaid(invoice.id)}
                                                    className="text-gray-600 hover:text-blue-600"
                                                >
                                                    <Banknote className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {(invoice.status !== 'PAID' && invoice.status !== 'OVERDUE') && (
                                                <Button
                                                    tooltip="Delete Invoice"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(invoice)}
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
                        {!loading && invoices.length > 0 && (
                            <BetterPagination pageCount={pageCount} page={page} setPage={setPage} />
                        )}
                    </CardFooter>
                )}
            </Card>

            <InvoiceCreate
                open={createInvoiceDialog}
                onOpenChange={(open: boolean) => { setCreateInvoiceDialog(open); if (!open) mutate() }}
            />

            <InvoiceEdit
                invoice={editInvoiceDialog}
                onOpenChange={(open: boolean) => { if (!open) setEditInvoiceDialog(null); mutate() }}
            />

            <InvoiceViewDialog
                invoice={viewInvoiceDialog}
                onOpenChange={(open: boolean) => { if (!open) setViewInvoiceDialog(null) }}
            />

            <InvoicePdfModal
                invoice={viewInvoicePdfDialog}
                onOpenChange={(open: boolean) => { if (!open) setViewInvoicePdfDialog(null) }}
            />

            <InvoiceDeleteDialog
                invoice={deleteInvoiceDialog}
                onOpenChange={(open: boolean) => { if (!open) setDeleteInvoiceDialog(null); mutate() }}
            />
        </>
    )
})
