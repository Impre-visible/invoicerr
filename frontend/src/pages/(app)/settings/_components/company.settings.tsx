import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { useGet, usePost } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import type { Company } from "@/types"
import CurrencySelect from "@/components/currency-select"
import { DatePicker } from "@/components/date-picker"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

export default function CompanySettings() {
    const { t } = useTranslation()
    const navigate = useNavigate()

    const ALLOWED_DATE_FORMATS = ['dd/LL/yyyy', 'LL/dd/yyyy', 'yyyy/LL/dd', 'dd.LL.yyyy', 'dd-LL-yyyy', 'yyyy-LL-dd', 'EEEE, dd MMM yyyy'];

    const validateNumberFormat = (pattern: string): boolean => {
        const patternRegex = /\{(\w+)(?::(\d+))?\}/g
        const validKeys = ["year", "month", "day", "number"]
        const requiredKeys = ["number"]

        let match
        const matches = []

        while ((match = patternRegex.exec(pattern)) !== null) {
            matches.push(match)
        }

        for (const key of requiredKeys) {
            if (!matches.some(m => m[1] === key)) {
                return false
            }
        }

        for (const match of matches) {
            const key = match[1]
            const padding = match[2]

            if (!validKeys.includes(key)) {
                return false
            }

            if (padding !== undefined) {
                const paddingNum = Number.parseInt(padding, 10)
                if (isNaN(paddingNum) || paddingNum < 0 || paddingNum > 20) {
                    return false
                }
            }
        }

        return true
    }

    const companySchema = z.object({
        name: z
            .string({ required_error: t("settings.company.form.company.errors.required") })
            .min(1, t("settings.company.form.company.errors.empty"))
            .max(100, t("settings.company.form.company.errors.maxLength")),
        description: z.string().max(500, t("settings.company.form.description.errors.maxLength")),
        legalId: z
            .string({ required_error: t("settings.company.form.legalId.errors.required") })
            .min(1, t("settings.company.form.legalId.errors.empty"))
            .max(50, t("settings.company.form.legalId.errors.maxLength"))
            .optional(),
        VAT: z
            .string({ required_error: t("settings.company.form.vat.errors.required") })
            .min(1, t("settings.company.form.vat.errors.empty"))
            .max(15, t("settings.company.form.vat.errors.maxLength"))
            .optional(),
        foundedAt: z.date().refine((date) => date <= new Date(), t("settings.company.form.foundedAt.errors.future")),
        currency: z
            .string({ required_error: t("settings.company.form.currency.errors.required") })
            .min(1, t("settings.company.form.currency.errors.select")),
        address: z.string().min(1, t("settings.company.form.address.errors.empty")),
        postalCode: z.string().refine((val) => {
            return /^[0-9A-Z\s-]{3,10}$/.test(val)
        }, t("settings.company.form.postalCode.errors.format")),
        city: z.string().min(1, t("settings.company.form.city.errors.empty")),
        country: z.string().min(1, t("settings.company.form.country.errors.empty")),
        phone: z
            .string()
            .min(8, t("settings.company.form.phone.errors.minLength"))
            .refine((val) => {
                return /^[+]?[0-9\s\-()]{8,20}$/.test(val)
            }, t("settings.company.form.phone.errors.format")),
        email: z
            .string()
            .email()
            .min(1, t("settings.company.form.email.errors.required"))
            .refine((val) => {
                return z.string().email().safeParse(val).success
            }, t("settings.company.form.email.errors.format")),
        quoteStartingNumber: z.number().min(1, t("settings.company.form.quoteStartingNumber.errors.min")),
        quoteNumberFormat: z
            .string()
            .min(1, t("settings.company.form.quoteNumberFormat.errors.required"))
            .max(100, t("settings.company.form.quoteNumberFormat.errors.maxLength"))
            .refine((val) => {
                return validateNumberFormat(val)
            }, t("settings.company.form.quoteNumberFormat.errors.format")),
        invoiceStartingNumber: z.number().min(1, t("settings.company.form.invoiceStartingNumber.errors.min")),
        invoiceNumberFormat: z
            .string()
            .min(1, t("settings.company.form.invoiceNumberFormat.errors.required"))
            .max(100, t("settings.company.form.invoiceNumberFormat.errors.maxLength"))
            .refine((val) => {
                return validateNumberFormat(val)
            }, t("settings.company.form.invoiceNumberFormat.errors.format")),
        invoicePDFFormat: z
            .string()
            .min(3, t("settings.company.form.invoicePDFFormat.errors.minLength"))
            .max(10, t("settings.company.form.invoicePDFFormat.errors.maxLength"))
            .refine((val) => {
                const validFormats = ['pdf', 'facturx', 'zugferd', 'xrechnung', 'ubl', 'cii']
                return validFormats.includes(val.toLowerCase())
            }, t("settings.company.form.invoicePDFFormat.errors.format")),
        dateFormat: z
            .string()
            .min(1, t("settings.company.form.dateFormat.errors.required"))
            .max(50, t("settings.company.form.dateFormat.errors.maxLength"))
            .refine((val) => {
                return ALLOWED_DATE_FORMATS.includes(val)
            }, t("settings.company.form.dateFormat.errors.format")),
    })

    const { data } = useGet<Company>("/api/company/info")
    const { trigger } = usePost<Company>("/api/company/info")
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof companySchema>>({
        resolver: zodResolver(companySchema),
        defaultValues: {
            name: "",
            description: "",
            legalId: "",
            VAT: "",
            foundedAt: new Date(),
            currency: "",
            address: "",
            postalCode: "",
            city: "",
            country: "",
            phone: "",
            email: "",
            invoicePDFFormat: "",
        },
    })

    useEffect(() => {
        if (data && Object.keys(data).length > 0) {
            form.reset({
                ...data,
                foundedAt: new Date(data.foundedAt),
            })
        }
    }, [data, form])

    async function onSubmit(values: z.infer<typeof companySchema>) {
        setIsLoading(true)
        trigger(values)
            .then(() => {
                toast.success(t("settings.company.messages.updateSuccess"))
                setTimeout(() => {
                    navigate(0)
                }, 150)
            })
            .catch((error) => {
                console.error("Error updating company settings:", error)
                toast.error(t("settings.company.messages.updateError"))
            })
            .finally(() => {
                setIsLoading(false)
            })
    }

    const getDateFormatOption = (dateFormat: string) => {
        return `${format(new Date(), dateFormat)} - (${dateFormat})`
    }

    return (
        <div>
            <div className="mb-4">
                <h1 className="text-3xl font-bold">{t("settings.company.title")}</h1>
                <p className="text-muted-foreground">{t("settings.company.description")}</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("settings.company.basicInfo")}</CardTitle>
                            <CardDescription>{t("settings.company.basicInfoDescription")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel required>{t("settings.company.form.company.label")}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t("settings.company.form.company.placeholder")} {...field} />
                                            </FormControl>
                                            <FormDescription>{t("settings.company.form.company.description")}</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("settings.company.form.description.label")}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t("settings.company.form.description.placeholder")} {...field} />
                                            </FormControl>
                                            <FormDescription>{t("settings.company.form.description.description")}</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="foundedAt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel required>{t("settings.company.form.foundedAt.label")}</FormLabel>
                                            <FormControl>
                                                <DatePicker
                                                    className="w-full bg-opacity-100"
                                                    value={field.value || null}
                                                    onChange={field.onChange}
                                                    placeholder={t("settings.company.form.foundedAt.placeholder")}
                                                />
                                            </FormControl>
                                            <FormDescription>{t("settings.company.form.foundedAt.description")}</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="currency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel required>{t("settings.company.form.currency.label")}</FormLabel>
                                            <FormControl>
                                                <CurrencySelect
                                                    value={field.value}
                                                    onChange={(value) => field.onChange(value)}
                                                />
                                            </FormControl>
                                            <FormDescription>{t("settings.company.form.currency.description")}</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="legalId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("settings.company.form.legalId.label")}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t("settings.company.form.legalId.placeholder")} {...field} />
                                            </FormControl>
                                            <FormDescription>{t("settings.company.form.legalId.description")}</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="VAT"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("settings.company.form.vat.label")}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t("settings.company.form.vat.placeholder")} {...field} />
                                            </FormControl>
                                            <FormDescription>{t("settings.company.form.vat.description")}</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("settings.company.address.title")}</CardTitle>
                            <CardDescription>{t("settings.company.address.description")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>{t("settings.company.form.address.label")}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t("settings.company.form.address.placeholder")} {...field} />
                                        </FormControl>
                                        <FormDescription>{t("settings.company.form.address.description")}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField
                                    control={form.control}
                                    name="postalCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel required>{t("settings.company.form.postalCode.label")}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t("settings.company.form.postalCode.placeholder")} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel required>{t("settings.company.form.city.label")}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t("settings.company.form.city.placeholder")} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="country"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel required>{t("settings.company.form.country.label")}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t("settings.company.form.country.placeholder")} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("settings.company.contact.title")}</CardTitle>
                            <CardDescription>{t("settings.company.contact.description")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel required>{t("settings.company.form.phone.label")}</FormLabel>
                                            <FormControl>
                                                <Input type="tel" placeholder={t("settings.company.form.phone.placeholder")} {...field} />
                                            </FormControl>
                                            <FormDescription>{t("settings.company.form.phone.description")}</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel required>{t("settings.company.form.email.label")}</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder={t("settings.company.form.email.placeholder")} {...field} />
                                            </FormControl>
                                            <FormDescription>{t("settings.company.form.email.description")}</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("settings.company.numberFormats.title")}</CardTitle>
                            <CardDescription>{t("settings.company.numberFormats.description")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="quoteStartingNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel required>{t("settings.company.form.quoteStartingNumber.label")}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder={t("settings.company.form.quoteStartingNumber.placeholder")}
                                                        {...field}
                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormDescription>{t("settings.company.form.quoteStartingNumber.description")}</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="quoteNumberFormat"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel required>{t("settings.company.form.quoteNumberFormat.label")}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder={t("settings.company.form.quoteNumberFormat.placeholder")} {...field} />
                                                </FormControl>
                                                <FormDescription>{t("settings.company.form.quoteNumberFormat.description")}</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="invoiceStartingNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel required>{t("settings.company.form.invoiceStartingNumber.label")}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder={t("settings.company.form.invoiceStartingNumber.placeholder")}
                                                        {...field}
                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    {t("settings.company.form.invoiceStartingNumber.description")}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="invoiceNumberFormat"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel required>{t("settings.company.form.invoiceNumberFormat.label")}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder={t("settings.company.form.invoiceNumberFormat.placeholder")} {...field} />
                                                </FormControl>
                                                <FormDescription>{t("settings.company.form.invoiceNumberFormat.description")}</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("settings.company.other.title")}</CardTitle>
                            <CardDescription>{t("settings.company.other.description")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="invoicePDFFormat"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>{t("settings.company.form.invoicePDFFormat.label")}</FormLabel>
                                        <FormControl>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={t("settings.company.form.invoicePDFFormat.placeholder")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pdf">{t("settings.company.form.invoicePDFFormat.options.pdf")}</SelectItem>
                                                    <SelectItem value="facturx">{t("settings.company.form.invoicePDFFormat.options.facturx")}</SelectItem>
                                                    <SelectItem value="zugferd">{t("settings.company.form.invoicePDFFormat.options.zugferd")}</SelectItem>
                                                    <SelectItem value="xrechnung">{t("settings.company.form.invoicePDFFormat.options.xrechnung")}</SelectItem>
                                                    <SelectItem value="ubl">{t("settings.company.form.invoicePDFFormat.options.ubl")}</SelectItem>
                                                    <SelectItem value="cii">{t("settings.company.form.invoicePDFFormat.options.cii")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormDescription>{t("settings.company.form.invoicePDFFormat.description")}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dateFormat"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>{t("settings.company.form.dateFormat.label")}</FormLabel>
                                        <FormControl>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={t("settings.company.form.dateFormat.placeholder")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ALLOWED_DATE_FORMATS.map((format) => (
                                                        <SelectItem key={format} value={format}>
                                                            {getDateFormatOption(format)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormDescription>{t("settings.company.form.dateFormat.description")}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading} className="min-w-32">
                            {isLoading ? t("settings.company.form.saving") : t("settings.company.form.saveSettings")}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
