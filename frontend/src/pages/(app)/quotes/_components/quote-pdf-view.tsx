import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useEffect, useState } from "react"

import type { Quote } from "@/types"
import { useGetRaw } from "@/lib/utils"
import { useTranslation } from "react-i18next"

type QuotePdfModalProps = {
  quote: Quote | null
  onOpenChange: (open: boolean) => void
}

export function QuotePdfModal({ quote, onOpenChange }: QuotePdfModalProps) {
  const { t } = useTranslation()
  const { data } = useGetRaw<Response>(`/api/quotes/${quote?.id}/pdf`)
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null)

  useEffect(() => {
    if (data) {
      data.arrayBuffer().then((buffer) => {
        setPdfData(new Uint8Array(buffer))
      })
    }
  }, [data])

  if (!quote) return null

  return (
    <Dialog
      open={!!quote}
      onOpenChange={(open) => {
        if (!open) {
          setPdfData(null)
        }
        onOpenChange(open)
      }}
    >
      <DialogContent className="!max-w-none w-fit min-w-[90vw] md:min-w-128 h-[90dvh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("quotes.pdf.title", { number: quote?.number })}</DialogTitle>
        </DialogHeader>

        <section className="h-full overflow-auto">
          {pdfData ? (
            <div className="flex justify-center h-full overflow-auto">
              <iframe
                className="w-full h-full"
                src={`data:application/pdf;base64,${btoa(String.fromCharCode(...pdfData))}`}
                title={t("quotes.pdf.title", { number: quote?.number })}
              />
            </div>
          ) : (
            <section className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
            </section>
          )}
        </section>
      </DialogContent>
    </Dialog >
  )
}
