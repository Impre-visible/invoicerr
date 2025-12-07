import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyIcon, PlusIcon, RefreshCwIcon, TrashIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCallback, useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

type InvitationCode = {
    id: string;
    code: string;
    createdAt: string;
    expiresAt: string | null;
    usedAt: string | null;
    usedBy: {
        id: string;
        email: string;
        firstname: string;
        lastname: string;
    } | null;
};

const getEnvVariable = (key: string): string | undefined => {
    return (window as any).__APP_CONFIG__?.[key] || import.meta.env[key];
};

export default function InvitationsSettings() {
    const { t } = useTranslation()
    const [invitations, setInvitations] = useState<InvitationCode[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [expiresInDays, setExpiresInDays] = useState<number | "">("")

    const backendUrl = getEnvVariable("VITE_BACKEND_URL") || "";

    const fetchInvitations = useCallback(async () => {
        setLoading(true)
        try {
            const response = await fetch(`${backendUrl}/invitations`, {
                credentials: "include",
            })
            if (response.ok) {
                const data = await response.json()
                setInvitations(data)
            }
        } catch (error) {
            console.error("Error fetching invitations:", error)
            toast.error(t("settings.invitations.messages.fetchError"))
        } finally {
            setLoading(false)
        }
    }, [backendUrl, t])

    useEffect(() => {
        fetchInvitations()
    }, [fetchInvitations])

    const createInvitation = async () => {
        setCreating(true)
        try {
            const response = await fetch(`${backendUrl}/invitations`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    expiresInDays: expiresInDays || undefined,
                }),
            })

            if (response.ok) {
                const newInvitation = await response.json()
                toast.success(t("settings.invitations.messages.createSuccess"))
                setExpiresInDays("")
                fetchInvitations()

                // Copy code to clipboard
                await navigator.clipboard.writeText(newInvitation.code)
                toast.info(t("settings.invitations.messages.codeCopied"))
            } else {
                toast.error(t("settings.invitations.messages.createError"))
            }
        } catch (error) {
            console.error("Error creating invitation:", error)
            toast.error(t("settings.invitations.messages.createError"))
        } finally {
            setCreating(false)
        }
    }

    const deleteInvitation = async (id: string) => {
        try {
            const response = await fetch(`${backendUrl}/invitations/${id}`, {
                method: "DELETE",
                credentials: "include",
            })

            if (response.ok) {
                toast.success(t("settings.invitations.messages.deleteSuccess"))
                fetchInvitations()
            } else {
                toast.error(t("settings.invitations.messages.deleteError"))
            }
        } catch (error) {
            console.error("Error deleting invitation:", error)
            toast.error(t("settings.invitations.messages.deleteError"))
        }
    }

    const copyCode = async (code: string) => {
        await navigator.clipboard.writeText(code)
        toast.success(t("settings.invitations.messages.codeCopied"))
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    const getStatus = (invitation: InvitationCode) => {
        if (invitation.usedAt) {
            return { label: t("settings.invitations.status.used"), variant: "secondary" as const }
        }
        if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
            return { label: t("settings.invitations.status.expired"), variant: "destructive" as const }
        }
        return { label: t("settings.invitations.status.active"), variant: "default" as const }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t("settings.invitations.create.title")}</CardTitle>
                    <CardDescription>
                        {t("settings.invitations.create.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="expiresInDays">
                                {t("settings.invitations.create.expiresIn")}
                            </Label>
                            <Input
                                id="expiresInDays"
                                type="number"
                                min="1"
                                placeholder={t("settings.invitations.create.expiresPlaceholder")}
                                value={expiresInDays}
                                onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : "")}
                            />
                        </div>
                        <Button onClick={createInvitation} disabled={creating}>
                            <PlusIcon className="h-4 w-4 mr-2" />
                            {creating
                                ? t("settings.invitations.create.creating")
                                : t("settings.invitations.create.button")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{t("settings.invitations.list.title")}</CardTitle>
                        <CardDescription>
                            {t("settings.invitations.list.description")}
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="icon" onClick={fetchInvitations} disabled={loading}>
                        <RefreshCwIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : invitations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {t("settings.invitations.list.empty")}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("settings.invitations.list.code")}</TableHead>
                                    <TableHead>{t("settings.invitations.list.status")}</TableHead>
                                    <TableHead>{t("settings.invitations.list.createdAt")}</TableHead>
                                    <TableHead>{t("settings.invitations.list.expiresAt")}</TableHead>
                                    <TableHead>{t("settings.invitations.list.usedBy")}</TableHead>
                                    <TableHead className="text-right">{t("settings.invitations.list.actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invitations.map((invitation) => {
                                    const status = getStatus(invitation)
                                    return (
                                        <TableRow key={invitation.id}>
                                            <TableCell className="font-mono text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate max-w-[120px]">
                                                        {invitation.code.substring(0, 8)}...
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => copyCode(invitation.code)}
                                                    >
                                                        <CopyIcon className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant}>{status.label}</Badge>
                                            </TableCell>
                                            <TableCell>{formatDate(invitation.createdAt)}</TableCell>
                                            <TableCell>
                                                {invitation.expiresAt
                                                    ? formatDate(invitation.expiresAt)
                                                    : t("settings.invitations.list.noExpiry")}
                                            </TableCell>
                                            <TableCell>
                                                {invitation.usedBy ? (
                                                    <span>
                                                        {invitation.usedBy.firstname} {invitation.usedBy.lastname}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {!invitation.usedAt && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive"
                                                        onClick={() => deleteInvitation(invitation.id)}
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
