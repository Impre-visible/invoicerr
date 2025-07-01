import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { Button } from "@/components/ui/button"
import type { Client } from "@/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "react-i18next"

interface ClientViewDialogProps {
    client: Client | null
    onOpenChange?: (open: boolean) => void
}

export function ClientViewDialog({ client, onOpenChange }: ClientViewDialogProps) {
    const { t } = useTranslation()

    return (
        <AlertDialog onOpenChange={onOpenChange}>
            <AlertDialogTrigger asChild>
                <Button variant="outline">View</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t("clients.view.title")}</AlertDialogTitle>
                    <AlertDialogDescription>{t("clients.view.description")}</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="companyName" className="text-right">
                            {t("clients.view.fields.companyName")}
                        </Label>
                        <Input type="text" id="companyName" value={client?.name} readOnly className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="contactPerson" className="text-right">
                            {t("clients.view.fields.contactPerson")}
                        </Label>
                        <Input type="text" id="contactPerson" value={`${client?.contactFirstname} ${client?.contactLastname}`} readOnly className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            {t("clients.view.fields.email")}
                        </Label>
                        <Input type="email" id="email" value={client?.contactEmail} readOnly className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                            {t("clients.view.fields.phone")}
                        </Label>
                        <Input type="tel" id="phone" value={client?.contactPhone} readOnly className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="address" className="text-right">
                            {t("clients.view.fields.address")}
                        </Label>
                        <Input type="text" id="address" value={client?.address} readOnly className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="postalCode" className="text-right">
                            {t("clients.view.fields.postalCode")}
                        </Label>
                        <Input type="text" id="postalCode" value={client?.postalCode} readOnly className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="city" className="text-right">
                            {t("clients.view.fields.city")}
                        </Label>
                        <Input type="text" id="city" value={client?.city} readOnly className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="country" className="text-right">
                            {t("clients.view.fields.country")}
                        </Label>
                        <Input type="text" id="country" value={client?.country} readOnly className="col-span-3" />
                    </div>
                </div>
                <AlertDialogFooter>
                    <Button type="button" variant="secondary" onClick={() => onOpenChange?.(false)}>
                        Close
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
