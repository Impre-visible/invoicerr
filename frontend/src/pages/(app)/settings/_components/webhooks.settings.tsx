"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDelete, useGet, usePost, authenticatedFetch } from "@/hooks/use-fetch"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "react-i18next"

interface Webhook {
    id: string
    url: string
    secret?: string
    type: string
    events: string[]
}

export default function WebhooksSettings() {
    const { t } = useTranslation()
    const { data: webhooks, mutate } = useGet<Webhook[]>('/api/webhooks')
    const { trigger: createWebhook, loading: creating } = usePost('/api/webhooks')
    // const { trigger: deleteWebhook } = useDelete('/api/webhooks')

    const [newUrl, setNewUrl] = useState('')
    const [newType, setNewType] = useState('GENERIC')
    const [newEvents, setNewEvents] = useState<string[]>([])
    const [createdSecret, setCreatedSecret] = useState<string | null>(null)

    const eventOptions = [
        'INVOICE_CREATED', 'INVOICE_UPDATED', 'INVOICE_DELETED',
        'QUOTE_CREATED', 'QUOTE_UPDATED', 'QUOTE_DELETED',
        'RECEIPT_CREATED', 'RECEIPT_UPDATED', 'RECEIPT_DELETED',
        'USER_CREATED', 'COMPANY_UPDATED'
    ]

    useEffect(() => {
        // initialize if needed
    }, [])

    const handleCreate = async () => {
        if (!newUrl.trim()) return
        try {
            const res = await createWebhook({ url: newUrl, type: newType, events: newEvents })
            // res expected: { success: true, data: { ...createdWebhook, secret } }
            if (res && (res as any).success) {
                const secret = (res as any).data?.secret
                if (secret) setCreatedSecret(secret)
                setNewUrl('')
                setNewType('GENERIC')
                setNewEvents([])
                mutate()
            }
        } catch (e) {
            // ignore
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
            const res = await authenticatedFetch(`${backendUrl}/api/webhooks/${id}`, { method: 'DELETE' })
            if (!res.ok) return
            const json = await res.json()
            if (json && json.success) mutate()
        } catch { }
    }

    return (
        <div>
            <div className="mb-4">
                <h1 className="text-3xl font-bold">{t("settings.webhooks.title")}</h1>
                <p className="text-muted-foreground">{t("settings.webhooks.description")}</p>
            </div>

            {createdSecret && (
                <Card className="mb-4">
                    <CardContent>
                        <CardTitle>{t('settings.webhooks.createdSecretTitle') || 'Webhook secret'}</CardTitle>
                        <CardDescription>
                            <div className="break-all font-mono bg-muted p-2 rounded">{createdSecret}</div>
                            <div className="text-sm text-muted-foreground mt-2">{t('settings.webhooks.createdSecretNotice') || 'This secret will be shown only once. Store it securely.'}</div>
                        </CardDescription>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {webhooks?.map((wh) => (
                        <Card key={wh.id}>
                            <CardContent>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{wh.type} - {wh.url}</CardTitle>
                                        <CardDescription className="mt-1">{wh.events.join(', ')}</CardDescription>
                                    </div>
                                    <Button variant="outline" size="icon" onClick={() => handleDelete(wh.id)}>
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("settings.webhooks.create.title")}</CardTitle>
                        <CardDescription>{t("settings.webhooks.create.description")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="url">{t("settings.webhooks.create.url")}</Label>
                                <Input id="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
                            </div>

                            <div>
                                <Label>{t("settings.webhooks.create.type")}</Label>
                                <Select value={newType} onValueChange={setNewType}>
                                    <SelectTrigger className="w-full h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GENERIC">GENERIC</SelectItem>
                                        <SelectItem value="SLACK">SLACK</SelectItem>
                                        <SelectItem value="DISCORD">DISCORD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>{t("settings.webhooks.create.events")}</Label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto">
                                    {eventOptions.map((evt) => (
                                        <button
                                            key={evt}
                                            type="button"
                                            className={`p-2 border rounded ${newEvents.includes(evt) ? 'bg-primary text-white' : ''}`}
                                            onClick={() => setNewEvents((prev) => prev.includes(evt) ? prev.filter(e => e !== evt) : [...prev, evt])}
                                        >
                                            {evt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={handleCreate} disabled={creating}>{t("settings.webhooks.create.button")}</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
