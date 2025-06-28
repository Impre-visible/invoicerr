import { Navigate, useNavigate, useParams } from "react-router"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import AccountSettings from "./_components/account.settings"
import CompanySettings from "./_components/company.settings"
import DangerZoneSettings from "./_components/danger.settings"
import EmailTemplatesSettings from "./_components/templates.settings"
import SignatureSettings from "./_components/signature.settings"
import { useAuth } from "@/contexts/auth"

export default function Settings() {
    const { accessToken } = useAuth()
    const { tab } = useParams()
    const navigate = useNavigate()

    if (!accessToken) return <Navigate to="/login" />

    const validTabs = ["company", "signature", "email", "account", "danger"]
    const currentTab = validTabs.includes(tab!) ? tab! : "company"

    const handleTabChange = (newTab: string) => {
        navigate(`/settings/${newTab}`)
    }

    /*
        Page content:

        - Company info (name, address, phone, email, logo, IBAN, VAT, etc.)
        - Signature settings (content, font, size) with preview for invoices/quotes
        - Email Template settings (for invoices/quotes)

        - Account settings (email, password, firstname, lastname)
        - Danger zone (delete account, delete everything, etc.)
    */


    return (
        <div className="max-w-6xl mx-auto space-y-6 px-6">
            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full h-fit p-8">
                <TabsList className="w-full h-12">
                    <TabsTrigger value="company">Company</TabsTrigger>
                    <TabsTrigger value="signature">Signature</TabsTrigger>
                    <TabsTrigger value="email">Email Templates</TabsTrigger>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="danger">Danger Zone</TabsTrigger>
                </TabsList>
                <section className="h-full w-full rounded-lg pt-4">
                    <TabsContent value="company" className="h-full"><CompanySettings /></TabsContent>
                    <TabsContent value="signature" className="h-full"><SignatureSettings /></TabsContent>
                    <TabsContent value="email" className="h-full"><EmailTemplatesSettings /></TabsContent>
                    <TabsContent value="account" className="h-full"><AccountSettings /></TabsContent>
                    <TabsContent value="danger" className="h-full"><DangerZoneSettings /></TabsContent>
                </section>
            </Tabs>
        </div>
    )
}
