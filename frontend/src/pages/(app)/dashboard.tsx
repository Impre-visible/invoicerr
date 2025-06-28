import { Card, CardContent } from "@/components/ui/card"
import type { Invoice, Quote } from "@/types"

import { LayoutDashboard } from "lucide-react"
import { useGet } from "@/lib/utils"

interface DashboardData {
    quotes: {
        total: number
        draft: number
        sent: number
        signed: number
        expired: number
        latests: Quote[]
    }
    invoices: {
        total: number
        unpaid: number
        sent: number
        paid: number
        overdue: number
        latests: Invoice[]
    }
    clients: {
        total: number
    }
}

export default function Dashboard() {
    const { data: dashboardData } = useGet<DashboardData>("/api/dashboard")

    return (
        <div className="max-w-6xl mx-auto space-y-10 p-6">
            {/* Header */}
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <LayoutDashboard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                    <div className="text-sm text-primary">Dashboard</div>
                    <div className="font-medium text-foreground">Welcome to your dashboard</div>
                </div>
            </div>

            {/* Quotes */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Quotes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <DashboardStat count={dashboardData?.quotes.total} label="Total Quotes" color="green" />
                    <DashboardStat count={dashboardData?.quotes.draft} label="Draft Quotes" color="yellow" />
                    <DashboardStat count={dashboardData?.quotes.sent} label="Sent Quotes" color="purple" />
                    <DashboardStat count={dashboardData?.quotes.signed} label="Signed Quotes" color="blue" />
                    <DashboardStat count={dashboardData?.quotes.expired} label="Expired Quotes" color="neutral" />
                </div>
                {dashboardData?.quotes.latests?.length ? (
                    <></>
                ) : null}
            </section>

            {/* Invoices */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Invoices</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <DashboardStat count={dashboardData?.invoices.total} label="Total Invoices" color="green" className="md:col-span-2" />
                    <DashboardStat count={dashboardData?.invoices.unpaid} label="Unpaid Invoices" color="yellow" className="md:col-span-2" />
                    <DashboardStat count={dashboardData?.invoices.sent} label="Sent Invoices" color="purple" className="md:col-span-2" />
                    <DashboardStat count={dashboardData?.invoices.paid} label="Paid Invoices" color="blue" className="md:col-span-3" />
                    <DashboardStat count={dashboardData?.invoices.overdue} label="Overdue Invoices" color="neutral" className="md:col-span-3" />
                </div>
                {dashboardData?.invoices.latests?.length ? (
                    <></>
                ) : null}
            </section>

            {/* Clients */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Clients</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <DashboardStat count={dashboardData?.clients.total} label="Total Clients" color="green" />
                </div>
            </section>
        </div>
    )
}

function DashboardStat({ count, label, color, className }: {
    count?: number
    label: string
    color: "green" | "yellow" | "purple" | "blue" | "neutral"
    className?: string
}) {
    return (
        <Card className={`w-full ${className}`}>
            <CardContent>
                <div className="flex items-center space-x-4">
                    <div className={`p-3 bg-${color}-100 rounded-lg`}>
                        <div className="w-6 h-6 flex items-center justify-center">
                            <div className={`w-3 h-3 bg-${color}-500 rounded-full`} />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-semibold text-foreground">{count ?? 0}</p>
                        <p className="text-sm text-primary">{label}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
