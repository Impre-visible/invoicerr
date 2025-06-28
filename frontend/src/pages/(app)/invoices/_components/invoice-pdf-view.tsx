import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Document, Page, pdfjs } from 'react-pdf';
import { useEffect, useState } from 'react';

import type { Invoice } from '@/types';
import { useGetRaw } from '@/lib/utils';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

type InvoicePdfModalProps = {
  invoice: Invoice | null;
  onOpenChange: (open: boolean) => void;
};

export function InvoicePdfModal({ invoice, onOpenChange }: InvoicePdfModalProps) {
  if (!invoice) return null;
  const { data } = useGetRaw<Response>(`/api/invoices/${invoice.id}/pdf`)
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (data) {
      data.arrayBuffer().then((buffer) => {
        setPdfData(new Uint8Array(buffer));
      })
    }
  }, [data]);

  return (
    <Dialog open={!!invoice} onOpenChange={(open) => {
      if (!open) {
        setPdfData(null);
      }
      onOpenChange(open);
    }}>
      <DialogContent className="!max-w-none w-fit min-w-[90vw] md:min-w-128 h-[90dvh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Invoice #{invoice?.number}</DialogTitle>
        </DialogHeader>
        <section className='h-full overflow-auto'>
          {pdfData && (
            <div className="flex justify-center h-full overflow-auto">
              <Document file={{ data: pdfData }} loading={
                <div className="flex items-center justify-center h-full w-full">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                </div>}>
                <Page pageNumber={1} className="rounded-md" />
              </Document>
            </div>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}
