import { AlertCircle, ArrowDownRight, ArrowUpRight, Calendar, CheckCircle, Clock, DollarSign, FileText, LayoutDashboard, Receipt, TrendingDown, TrendingUp, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Company, Invoice, Quote } from "@/types"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { InvoiceList } from "@/pages/(app)/invoices/_components/invoice-list"
import { QuoteList } from "@/pages/(app)/quotes/_components/quote-list"
import { useGet } from "@/lib/utils"
import { useNavigate } from "react-router"

interface DashboardData {
    company: Company | null,
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
    revenue: {
        currentMonth: number
        previousMonth: number
        monthlyChange: number
        monthlyChangePercent: number
        currentYear: number
        previousYear: number
        yearlyChange: number
        yearlyChangePercent: number
    }
}

export default function Dashboard() {
    const { data: dashboardData } = useGet<DashboardData>("/api/dashboard")

    const navigate = useNavigate()

    const formatCurrency = (amount: number | null | undefined) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: dashboardData?.company?.currency || "USD",
        }).format(amount || 0)
    }

    const formatChangePercent = (percent: number = 0) => {
        const sign = percent >= 0 ? "+" : ""
        return `${sign}${percent.toFixed(1)}%`
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 p-6">
            <Dialog open={!(dashboardData?.company)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Company not configured</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Please configure your company details before using the dashboard.
                    </p>
                    <DialogFooter>
                        <Button onClick={() => navigate("/settings/company")}>
                            Go
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <LayoutDashboard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back! Here's your business overview</p>
                </div>
            </div>

            <section className="space-y-6">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500 rounded-lg">
                        <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Revenue Overview</h2>
                        <p className="text-sm text-muted-foreground">Track your financial performance</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                    <Card>
                        <CardContent className="px-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">This Month</p>
                                    <p className="text-2xl font-bold text-foreground">
                                        {formatCurrency(dashboardData?.revenue.currentMonth)}
                                    </p>
                                    <div className="flex items-center mt-2">
                                        {(dashboardData?.revenue.monthlyChangePercent || 0) >= 0 ? (
                                            <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                                        ) : (
                                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                                        )}
                                        <span
                                            className={`text-sm ml-1 ${(dashboardData?.revenue.monthlyChangePercent || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                                                }`}
                                        >
                                            {formatChangePercent(dashboardData?.revenue.monthlyChangePercent)}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-emerald-500 rounded-full">
                                    <DollarSign className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="px-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Last Month</p>
                                    <p className="text-2xl font-bold text-foreground">
                                        {formatCurrency(dashboardData?.revenue.previousMonth || 0)}
                                    </p>
                                    <div className="flex items-center mt-2">
                                        <span className="text-sm text-muted-foreground">
                                            {formatCurrency(Math.abs(dashboardData?.revenue.monthlyChange || 0))} difference
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-500 rounded-full">
                                    <Calendar className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="px-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">This Year</p>
                                    <p className="text-2xl font-bold text-foreground">
                                        {formatCurrency(dashboardData?.revenue.currentYear)}
                                    </p>
                                    <div className="flex items-center mt-2">
                                        {(dashboardData?.revenue.yearlyChangePercent || 0) >= 0 ? (
                                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4 text-red-600" />
                                        )}
                                        <span
                                            className={`text-sm ml-1 ${(dashboardData?.revenue.yearlyChangePercent || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                                                }`}
                                        >
                                            {formatChangePercent(dashboardData?.revenue.yearlyChangePercent || 0)}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-blue-500 rounded-full">
                                    <TrendingUp className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="px-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Active Projects</p>
                                    <p className="text-2xl font-bold text-foreground">
                                        {(dashboardData?.quotes.sent || 0) + (dashboardData?.invoices.unpaid || 0)}
                                    </p>
                                    <div className="flex items-center mt-2">
                                        <span className="text-sm text-muted-foreground">
                                            {dashboardData?.quotes.sent || 0} quotes, {dashboardData?.invoices.unpaid || 0} invoices
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-purple-500 rounded-full">
                                    <Users className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="space-y-6">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500 rounded-lg">
                        <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Quotes Overview</h2>
                        <p className="text-sm text-muted-foreground">Track your quote performance</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <DashboardStat
                        count={dashboardData?.quotes.total}
                        label="Total Quotes"
                        color="green"
                        icon={<FileText />}
                        className="lg:col-span-2"
                    />
                    <DashboardStat
                        count={dashboardData?.quotes.draft}
                        label="Draft Quotes"
                        icon={<Clock />}
                        color="amber"
                        className="lg:col-span-2"
                    />
                    <DashboardStat
                        count={dashboardData?.quotes.sent}
                        label="Sent Quotes"
                        icon={<ArrowUpRight />}
                        color="blue"
                        className="lg:col-span-2"
                    />
                    <DashboardStat
                        count={dashboardData?.quotes.signed}
                        label="Signed Quotes"
                        icon={<CheckCircle />}
                        color="emerald"
                        className="lg:col-span-3"
                    />
                    <DashboardStat
                        count={dashboardData?.quotes.expired}
                        label="Expired Quotes"
                        icon={<AlertCircle />}
                        color="red"
                        className="lg:col-span-3"
                    />
                </div>
                {dashboardData?.quotes.latests?.length ? (

                    <QuoteList
                        quotes={dashboardData.quotes.latests}
                        loading={!dashboardData}
                        title="Latest Quotes"
                        description=""
                        mutate={() => { }}
                        emptyState={<div className="text-center py-8 text-muted-foreground">No recent quotes.</div>}
                        showCreateButton={false}
                    />
                ) : null}
            </section>

            <section className="space-y-6">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500 rounded-lg">
                        <Receipt className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Invoices Overview</h2>
                        <p className="text-sm text-muted-foreground">Track your billing status</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <DashboardStat
                        count={dashboardData?.invoices.total}
                        label="Total Invoices"
                        color="green"
                        icon={<Receipt />}
                        className="lg:col-span-2"
                    />
                    <DashboardStat
                        count={dashboardData?.invoices.unpaid}
                        label="Unpaid Invoices"
                        icon={<Clock />}
                        color="amber"
                        className="lg:col-span-2"
                    />
                    <DashboardStat
                        count={dashboardData?.invoices.sent}
                        label="Sent Invoices"
                        icon={<ArrowUpRight />}
                        color="blue"
                        className="lg:col-span-2"
                    />
                    <DashboardStat
                        count={dashboardData?.invoices.paid}
                        label="Paid Invoices"
                        icon={<CheckCircle />}
                        color="emerald"
                        className="lg:col-span-3"
                    />
                    <DashboardStat
                        count={dashboardData?.invoices.overdue}
                        label="Overdu Invoices"
                        icon={<AlertCircle />}
                        color="red"
                        className="lg:col-span-3"
                    />
                </div>
                {dashboardData?.invoices.latests?.length ? (

                    <InvoiceList
                        invoices={dashboardData.invoices.latests}
                        loading={!dashboardData}
                        title="Latest Invoices"
                        description=""
                        mutate={() => { }}
                        emptyState={<div className="text-center py-8 text-muted-foreground">No recent invoices.</div>}
                        showCreateButton={false}
                    />
                ) : null}
            </section>



            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Clients</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                    <DashboardStat count={dashboardData?.clients.total} label="Total Clients" color="green" />
                </div>
            </section>
        </div>
    )
}

const colorVariants = {
    green: {
        bg: "bg-green-100",
        text: "text-green-600",
        dot: "bg-green-500"
    },
    yellow: {
        bg: "bg-yellow-100",
        text: "text-yellow-600",
        dot: "bg-yellow-500"
    },
    red: {
        bg: "bg-red-100",
        text: "text-red-600",
        dot: "bg-red-500"
    },
    emerald: {
        bg: "bg-emerald-100",
        text: "text-emerald-600",
        dot: "bg-emerald-500"
    },
    blue: {
        bg: "bg-blue-100",
        text: "text-blue-600",
        dot: "bg-blue-500"
    },
    amber: {
        bg: "bg-amber-100",
        text: "text-amber-600",
        dot: "bg-amber-500"
    },
    neutral: {
        bg: "bg-neutral-100",
        text: "text-neutral-600",
        dot: "bg-neutral-500"
    }
} as const

function DashboardStat({ count, label, color, className, icon }: {
    count?: number
    label: string
    icon?: React.ReactNode
    color: keyof typeof colorVariants
    className?: string
}) {
    const colors = colorVariants[color]

    return (
        <Card className={`w-full ${className}`}>
            <CardContent>
                <div className="flex items-center space-x-4">
                    <div className={`p-3 ${colors.bg} rounded-lg`}>
                        <div className="w-6 h-6 flex items-center justify-center">
                            {icon ? (
                                <div className={colors.text}>{icon}</div>
                            ) : (
                                <div className={`w-3 h-3 ${colors.dot} rounded-full`}></div>
                            )}
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
