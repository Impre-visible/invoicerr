import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import type { CreditNote } from "@/types"
import { useDelete } from "@/lib/utils"
import { useTranslation } from "react-i18next"

interface CreditNoteDeleteDialogProps {
    creditNote: CreditNote | null
    onOpenChange: (open: boolean) => void
}

export function CreditNoteDeleteDialog({ creditNote, onOpenChange }: CreditNoteDeleteDialogProps) {
    const { t } = useTranslation()
    const { trigger } = useDelete(`/api/credit-notes/${creditNote?.id}`)

    const handleDelete = () => {
        if (!creditNote) return

        trigger()
            .then(() => {
                onOpenChange(false)
            })
            .catch((error) => {
                console.error("Failed to delete credit note:", error)
            })
    }

    return (
        <Dialog open={creditNote != null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("credit-notes.delete.title")}</DialogTitle>
                    <DialogDescription>{t("credit-notes.delete.description")}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex !flex-col-reverse gap-2 justify-end">
                    <Button variant="outline" className="w-full bg-transparent" onClick={() => onOpenChange(false)}>
                        {t("credit-notes.delete.actions.cancel")}
                    </Button>
                    <Button variant="destructive" className="w-full" onClick={handleDelete}>
                        {t("credit-notes.delete.actions.delete")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
