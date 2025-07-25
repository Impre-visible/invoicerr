"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GitBranch, Plus, Trash2 } from "lucide-react"
import { useDelete, useGet, usePost } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type React from "react"
import { toast } from "sonner"
import { useState } from "react"
import { useTranslation } from "react-i18next"

interface Plugin {
    uuid: string
    name: string
    description: string
}

export default function PluginsSettings() {
    const { t } = useTranslation()

    const { data: plugins, mutate } = useGet<Plugin[]>("/api/plugins")

    const { trigger: addPlugin, loading: addLoading } = usePost("/api/plugins")
    const { trigger: deletePlugin, loading: deleteLoading } = useDelete("/api/plugins")

    const [gitUrl, setGitUrl] = useState("")
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    const handleDeletePlugin = async (uuid: string) => {
        setIsDeleting(uuid)
        try {
            deletePlugin({ uuid })
                .then((response) => {
                    if (!response.success) {
                        throw new Error("Failed to delete plugin");
                    }
                    toast.success(t("settings.plugins.messages.deleteSuccess"));
                    mutate();
                })
                .catch((_error) => {
                    toast.error(t("settings.plugins.messages.deleteError"));
                });
        } catch (error) {
            toast.error(t("settings.plugins.messages.deleteError"));
        } finally {
            setIsDeleting(null)
        }
    }

    const handleAddPlugin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!gitUrl.trim()) return

        try {
            // Remove .git suffix if present
            const cleanUrl = gitUrl.replace(/\.git$/, "")

            addPlugin({ gitUrl: cleanUrl })
                .then((response) => {
                    if (!response) {
                        throw new Error("Failed to add plugin");
                    }
                    toast.success(t("settings.plugins.messages.addSuccess"));
                    setGitUrl("")
                    mutate();
                })
                .catch((_error) => {
                    toast.error(t("settings.plugins.messages.addError"));
                });
        } catch (error) {
            toast.error(t("settings.plugins.messages.addError"));
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold mb-2">{t("settings.plugins.title", { count: plugins?.length || 0 })}</h1>
                <p className="text-muted-foreground">
                    {t("settings.plugins.description")}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        {t("settings.plugins.add.title")}
                    </CardTitle>
                    <CardDescription>{t("settings.plugins.add.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddPlugin} className="flex gap-2">
                        <div className="flex-1">
                            <Label htmlFor="git-url" className="sr-only">
                                {t("settings.plugins.add.gitUrl.label")}
                            </Label>
                            <Input
                                id="git-url"
                                type="url"
                                placeholder={t("settings.plugins.add.gitUrl.placeholder")}
                                value={gitUrl}
                                onChange={(e) => setGitUrl(e.target.value)}
                                disabled={addLoading}
                            />
                        </div>
                        <Button type="submit" disabled={addLoading || !gitUrl.trim()}>
                            {addLoading ? t("settings.plugins.actions.addLoading") : t("settings.plugins.actions.add")}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {plugins?.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground text-center">
                                {t("settings.plugins.emptyState.noPlugins")}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    plugins?.map((plugin: Plugin) => (
                        <Card key={plugin.uuid}>
                            <CardContent>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{plugin.name}</CardTitle>
                                        <CardDescription className="mt-1">{plugin.description}</CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleDeletePlugin(plugin.uuid)}
                                        disabled={deleteLoading && isDeleting === plugin.uuid}
                                        className="text-destructive hover:text-destructive"

                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">
                                            {deleteLoading && isDeleting === plugin.uuid
                                                ? t("settings.plugins.actions.deleting")
                                                : t("settings.plugins.actions.delete")}
                                        </span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
