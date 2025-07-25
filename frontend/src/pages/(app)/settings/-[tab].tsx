import { AlertTriangle, Building2, FileText, Mail, Plug, User } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNavigate, useParams } from "react-router"

import AccountSettings from "./_components/account.settings"
import CompanySettings from "./_components/company.settings"
import DangerZoneSettings from "./_components/danger.settings"
import EmailTemplatesSettings from "./_components/templates.settings"
import PDFTemplatesSettings from "./_components/pdf.settings"
import PluginsSettings from "./_components/plugins.settings"
import { useTranslation } from "react-i18next"

export default function Settings() {
    const { t } = useTranslation()
    const { tab } = useParams()
    const navigate = useNavigate()

    const validTabs = ["company", "template", "email", "account", "plugins", "danger"]
    const currentTab = validTabs.includes(tab!) ? tab! : "company"

    const handleTabChange = (newTab: string) => {
        navigate(`/settings/${newTab}`)
    }

    const tabsConfig = [
        {
            value: "company",
            label: t("settings.tabs.company"),
            icon: Building2,
        },
        {
            value: "template",
            label: t("settings.tabs.pdfTemplates"),
            icon: FileText,
        },
        {
            value: "email",
            label: t("settings.tabs.emailTemplates"),
            icon: Mail,
        },
        {
            value: "account",
            label: t("settings.tabs.account"),
            icon: User,
        },
        {
            value: "plugins",
            label: t("settings.tabs.plugins"),
            icon: Plug,
        },
        {
            value: "danger",
            label: t("settings.tabs.dangerZone"),
            icon: AlertTriangle,
        },
    ]

    const currentTabConfig = tabsConfig.find((tab) => tab.value === currentTab)

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            {/* Mobile/Tablet Select */}
            <div className="lg:hidden">
                <Select value={currentTab} onValueChange={handleTabChange}>
                    <SelectTrigger className="w-full h-12">
                        <SelectValue>
                            <div className="flex items-center gap-2">
                                {currentTabConfig?.icon && <currentTabConfig.icon className="h-4 w-4" />}
                                {currentTabConfig?.label}
                            </div>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {tabsConfig.map((tab) => (
                            <SelectItem key={tab.value} value={tab.value}>
                                <div className="flex items-center gap-2">
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Desktop Tabs */}
            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full h-fit">
                <TabsList className="hidden lg:flex w-full h-12">
                    {tabsConfig.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                            <tab.icon className="h-4 w-4" />
                            <span className="inline">{tab.label}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                <section className="h-full w-full rounded-lg pt-4">
                    <TabsContent value="company" className="h-full">
                        <CompanySettings />
                    </TabsContent>
                    <TabsContent value="template" className="h-full">
                        <PDFTemplatesSettings />
                    </TabsContent>
                    <TabsContent value="email" className="h-full">
                        <EmailTemplatesSettings />
                    </TabsContent>
                    <TabsContent value="account" className="h-full">
                        <AccountSettings />
                    </TabsContent>
                    <TabsContent value="plugins" className="h-full">
                        <PluginsSettings />
                    </TabsContent>
                    <TabsContent value="danger" className="h-full">
                        <DangerZoneSettings />
                    </TabsContent>
                </section>
            </Tabs>
        </div>
    )
}
