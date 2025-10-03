import { Banknote, Plus, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { PaymentMethodsList, type PaymentMethodsListHandle } from "@/pages/(app)/payment-methods/_components/payment-method-list"
import { useRef, useState } from "react"
import { useGet } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "react-i18next"


export default function PaymentMethodsPage() {
  const { t } = useTranslation()
  const pmListRef = useRef<PaymentMethodsListHandle>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { data: paymentMethods = [], mutate, loading } = useGet<any[]>("/api/payment-methods")

  const filtered = (paymentMethods || []).filter((pm) =>
    (pm.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pm.details || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pm.type || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const emptyState = (
    <div className="text-center py-12">
      <Banknote className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-foreground">{searchTerm ? t("paymentMethods.list.empty") || t("paymentMethods.empty") : t("paymentMethods.list.empty") || t("paymentMethods.empty")}</h3>
      <p className="mt-1 text-sm text-primary">{searchTerm ? "" : t("paymentMethods.description")}</p>
      {!searchTerm && (
        <div className="mt-6">
          <Button onClick={() => pmListRef.current?.handleAddClick()}>
            <Plus className="h-4 w-4 mr-2" />
            {t("paymentMethods.list.add") || t("paymentMethods.add.title") || t("actions.add")}
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-0 lg:justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Banknote className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="text-sm text-primary">{t("paymentMethods.description") || t("paymentMethods.title")}</div>
            <div className="font-medium text-foreground">{`${filtered.length} ${t("paymentMethods.title")}`}</div>
          </div>
        </div>

        <div className="flex flex-row items-center gap-4 w-full lg:w-fit lg:gap-6 lg:justify-between">
          <div className="relative w-full lg:w-fit">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder={t("paymentMethods.search.placeholder") || ""} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full" />
          </div>
          <Button onClick={() => pmListRef.current?.handleAddClick()}>
            <Plus className="h-4 w-4 mr-0 md:mr-2" />
            <span className="hidden md:inline-flex">{t("paymentMethods.list.add") || t("paymentMethods.add.title") || t("actions.add")}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Banknote className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{paymentMethods?.length || 0}</p>
                <p className="text-sm text-primary">{t("paymentMethods.stats.total") || t("paymentMethods.title")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <PaymentMethodsList
        ref={pmListRef}
        paymentMethods={filtered}
        loading={loading}
        title={t("paymentMethods.title")}
        description={t("paymentMethods.description")}
        mutate={() => mutate?.()}
        emptyState={emptyState}
        showCreateButton={true}
      />
    </div>
  )
}