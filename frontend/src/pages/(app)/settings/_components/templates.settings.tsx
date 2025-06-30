"use client"

import { Archive, Forward, Mail, Reply } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
import { useGet, usePut } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { TabsContent } from "@radix-ui/react-tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface EmailTemplate {
    id: string
    dbId: string
    companyId: string
    name: string
    subject: string
    body: string
    variables: Record<string, string>
}

function HtmlEditor({
    value,
    onChange,
}: {
    value: string
    onChange: (value: string) => void
    variables: Record<string, string>
}) {

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Textarea
                    id="html-editor"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Écrivez votre HTML ici..."
                    className="min-h-[400px] font-mono text-sm"
                    style={{ resize: "vertical" }}
                />
                <div className="text-xs text-muted-foreground">
                    💡 Écrivez du HTML directement. Utilisez les boutons ci-dessus pour insérer des balises et variables.
                </div>
            </div>
        </div>
    )
}

function EmailPreview({ template }: { template: EmailTemplate }) {
    const replaceVariables = (text: string, variables: Record<string, string>) => {
        console.log("Replacing variables in:", text, "with", variables)
        let result = text
        Object.entries(variables).forEach(([key, value]) => {
            result = result.replace(new RegExp(`{{${key}}}`, "g"), value)
        })
        return result
    }

    const previewSubject = replaceVariables(template.subject, template.variables)
    const previewBody = replaceVariables(template.body, template.variables)

    return (
        <div className="bg-gray-100 p-4 rounded-lg h-full w-full">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
                <div className="border-b p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-gray-900">Invoicerr Mail</span>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex gap-2 bg-gray-50 p-2 rounded">
                            <span className="font-medium text-gray-600">From:</span>
                            <span className="text-gray-900">noreply@invoicerr.dev</span>
                        </div>
                        <div className="flex gap-2 bg-gray-50 p-2 rounded">
                            <span className="font-medium text-gray-600">To:</span>
                            <span className="text-gray-900">user@example.com</span>
                        </div>
                        <div className="flex gap-2 bg-gray-50 p-2 rounded">
                            <span className="font-medium text-gray-600">Subject:</span>
                            <span className="text-gray-900">{previewSubject}</span>
                        </div>
                    </div>
                </div>

                <Separator className="bg-neutral-200" orientation="horizontal" />

                <div className="p-4">
                    <div
                        className="prose prose-sm max-w-none [*]:text-black"
                        style={{ fontFamily: "Arial, sans-serif" }}
                        dangerouslySetInnerHTML={{ __html: previewBody }}
                    />
                </div>

                <div className="border-t p-4 flex gap-2">
                    <Button>
                        <Reply className="h-4 w-4" />
                        Reply
                    </Button>
                    <Button>
                        <Forward className="h-4 w-4" />
                        Forward
                    </Button>
                    <Button>
                        <Archive className="h-4 w-4" />
                        Archive
                    </Button>
                </div>
            </div>
        </div>
    )
}

function TemplateEditor({
    template,
    onUpdate,
}: {
    template: EmailTemplate
    onUpdate: (template: EmailTemplate) => void
}) {
    return (
        <div className="w-full space-y-4">
            <div className="space-y-2">
                <Label htmlFor={`subject-${template.id}`}>Subject</Label>
                <Input
                    id={`subject-${template.id}`}
                    value={template.subject}
                    autoComplete="off"
                    data-bwignore data-1p-ignore data-lpignore data-form-type="other"
                    onChange={(e) => onUpdate({ ...template, subject: e.target.value })}
                    placeholder="Email subject..."
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor={`body-${template.id}`}>Body (HTML)</Label>
                <HtmlEditor
                    value={template.body}
                    onChange={(body) => onUpdate({ ...template, body })}
                    variables={template.variables}
                />
            </div>

            <div className="space-y-2">
                <Label>Available Variables</Label>
                <div className="flex flex-wrap gap-2">
                    {Object.keys(template.variables).map((variable) => (
                        <Badge key={variable} variant="secondary" className="font-mono">
                            {`{{${variable}}}`}
                        </Badge>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">
                    Click on variable buttons in the editor toolbar to insert them into your HTML.
                </p>
            </div>
        </div>
    )
}


export default function EmailTemplatesSettings() {
    const { data: templates } = useGet<EmailTemplate[]>("/api/company/email-templates")
    const { trigger: updateTemplate, loading: updateLoading } = usePut<EmailTemplate>("/api/company/email-templates")

    const [editedTemplate, setEditedTemplate] = useState<EmailTemplate | null>(null)
    const [activeTab, setActiveTab] = useState<string | null>(null)

    useEffect(() => {
        if (templates?.length && !activeTab) {
            setActiveTab(templates[0].id)
        }
    }, [templates, activeTab])

    useEffect(() => {
        if (activeTab && templates) {
            const current = templates.find((t) => t.id === activeTab)
            setEditedTemplate(current ? { ...current } : null)
        }
    }, [activeTab, templates])

    function saveEditing() {
        if (!editedTemplate) return
        updateTemplate({
            ...editedTemplate,
            companyId: editedTemplate.companyId,
        }).then(() => {
            toast.success(`Template "${editedTemplate.name}" saved successfully`)
        }).catch((_error) => {
            toast.error(`Failed to save template`)
        })
    }

    if (!templates) return null

    return (
        <div>
            <div className="mb-4">
                <h1 className="text-3xl font-bold">Email Template Settings</h1>
                <p className="text-muted-foreground">Manage your email templates for mail notifications.</p>
            </div>

            <Tabs value={activeTab || undefined} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                    {templates.map((template) => (
                        <TabsTrigger key={template.id} value={template.id}>
                            {template.name}
                        </TabsTrigger>
                    ))}
                </TabsList>
                <TabsContent value={activeTab || ''}>
                    {editedTemplate && (
                        <section className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-semibold">{editedTemplate.name}</h2>
                                <Button
                                    onClick={saveEditing}
                                    disabled={updateLoading}
                                    loading={updateLoading}
                                    variant="default"
                                >
                                    Save Changes
                                </Button>
                            </div>
                            <div className="space-y-6 flex gap-4">
                                <TemplateEditor
                                    template={editedTemplate}
                                    onUpdate={(updated) => setEditedTemplate(updated)}
                                />

                                <EmailPreview template={editedTemplate} />
                            </div>
                        </section>
                    )}
                </TabsContent>
            </Tabs>

        </div>
    )
}
