import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Document, Page, pdfjs } from 'react-pdf';
import { useEffect, useState } from 'react';

import type { Quote } from '@/types';
import { useGetRaw } from '@/lib/utils';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

type QuotePdfModalProps = {
  quote: Quote | null;
  onOpenChange: (open: boolean) => void;
};

export function QuotePdfModal({ quote, onOpenChange }: QuotePdfModalProps) {
  const { data } = useGetRaw<Response>(`/api/quotes/${quote?.id}/pdf`)
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (data) {
      data.arrayBuffer().then((buffer) => {
        setPdfData(new Uint8Array(buffer));
      })
    }
  }, [data]);

  return (
    <Dialog open={!!quote} onOpenChange={(open) => {
      if (!open) {
        setPdfData(null);
      }
      onOpenChange(open);
    }}>
      <DialogContent className="!max-w-none w-fit h-[90dvh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Quote #{quote?.number}</DialogTitle>
        </DialogHeader>
        <section className='h-full overflow-auto'>
          {!pdfData && <p>Loading...</p>}
          {pdfData && (
            <div className="flex justify-center h-full">
              <Document file={{ data: pdfData }}>
                <Page pageNumber={1} width={700} />
              </Document>
            </div>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}
