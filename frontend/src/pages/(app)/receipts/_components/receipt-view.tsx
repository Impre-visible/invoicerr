import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import type { Receipt } from "@/types"
import { useTranslation } from "react-i18next"

interface ReceiptViewDialogProps {
    receipt: Receipt | null
    onOpenChange: (open: boolean) => void
}

export function ReceiptViewDialog({ receipt, onOpenChange }: ReceiptViewDialogProps) {
    const { t } = useTranslation()

    if (!receipt) return null


    return (
        <Dialog open={!!receipt} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] lg:max-w-3xl max-h-[90dvh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="text-xl font-semibold">
                        {t("quotes.view.title", { number: receipt })}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">{t("quotes.view.description")}</DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}
