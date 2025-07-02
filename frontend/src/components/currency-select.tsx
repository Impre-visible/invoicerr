import SearchSelect from "@/components/search-input"
import { currencies } from "@/lib/constants/currencies"
import { useEffect } from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

export default function CurrencySelect({ value, onChange }: { value: string | undefined; onChange: (value: string | string[]) => void }) {
    const [currencySearch, setCurrencySearch] = useState("")
    const [searchedCurrencies, setSearchedCurrencies] = useState<
        {
            label: string
            value: string
        }[]
    >([])

    const { t } = useTranslation()



    useEffect(() => {
        if (currencies && currencySearch.length < 1) {
            setSearchedCurrencies(
                Object.entries(currencies).map(([code, { name, symbol }]) => ({
                    label: `${name} (${symbol})`,
                    value: code,
                })),
            )
        }
    }, [currencySearch])

    const handleSearchChange = (search: string) => {
        setCurrencySearch(search)
        if (search.length == 0) {
            setSearchedCurrencies(
                Object.entries(currencies).map(([code, { name, symbol }]) => ({
                    label: `${name} (${symbol})`,
                    value: code,
                })),
            )
            return
        }

        const filteredCurrencies = Object.entries(currencies)
            .filter(([code, { name, symbol, demonym }]) => {
                const label = `${name} (${symbol})`
                return (
                    label.toLowerCase().includes(search.toLowerCase()) ||
                    code.toLowerCase().includes(search.toLowerCase()) ||
                    symbol.toLowerCase().includes(search.toLowerCase()) ||
                    demonym.toLowerCase().includes(search.toLowerCase())
                )
            })
            .map(([code, { name, symbol }]) => ({
                label: `${name} (${symbol})`,
                value: code,
            }))

        setSearchedCurrencies(filteredCurrencies)
    }

    return (
        <SearchSelect
            options={searchedCurrencies}
            allOptions={Object.entries(currencies).map(([code, { name, symbol }]) => ({
                label: `${name} (${symbol})`,
                value: code,
            }))}
            value={value}
            multiple={false}
            onValueChange={onChange}
            onSearchChange={handleSearchChange}
            placeholder={t("component.currency-select.placeholder")}
            searchPlaceholder={t("component.currency-select.searchPlaceholder")}
            noResultsText={t("component.currency-select.noResults")}
            className="w-full"
        />
    );
}