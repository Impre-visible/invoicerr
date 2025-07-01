import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNavigate, useParams } from "react-router"

import AccountSettings from "./_components/account.settings"
import CompanySettings from "./_components/company.settings"
import DangerZoneSettings from "./_components/danger.settings"
import EmailTemplatesSettings from "./_components/templates.settings"
import PDFTemplatesSettings from "./_components/pdf.settings"
import { useTranslation } from "react-i18next"

export default function Settings() {
    const { t } = useTranslation()
    const { tab } = useParams()
    const navigate = useNavigate()

    const validTabs = ["company", "template", "email", "account", "danger"]
    const currentTab = validTabs.includes(tab!) ? tab! : "company"

    const handleTabChange = (newTab: string) => {
        navigate(`/settings/${newTab}`)
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full h-fit">
                <TabsList className="w-full h-12">
                    <TabsTrigger value="company">{t("settings.tabs.company")}</TabsTrigger>
                    <TabsTrigger value="template">{t("settings.tabs.pdfTemplates")}</TabsTrigger>
                    <TabsTrigger value="email">{t("settings.tabs.emailTemplates")}</TabsTrigger>
                    <TabsTrigger value="account">{t("settings.tabs.account")}</TabsTrigger>
                    <TabsTrigger value="danger">{t("settings.tabs.dangerZone")}</TabsTrigger>
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
                    <TabsContent value="danger" className="h-full">
                        <DangerZoneSettings />
                    </TabsContent>
                </section>
            </Tabs>
        </div>
    )
}
