import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { useGet, usePost } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import type { Company } from "@/types"
import { DatePicker } from "@/components/date-picker"
import { Input } from "@/components/ui/input"
import SearchSelect from "@/components/search-input"
import { currencies } from "@/lib/constants/currencies"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

const companySchema = z.object({
    name: z.string({ required_error: "Company name is required" }).min(1, "Company name cannot be empty").max(100, "Name cannot exceed 100 characters"),
    description: z.string().max(500, "Description cannot exceed 500 characters"),
    legalId: z.string({ required_error: "Legal ID is required" }).min(1, "Legal ID cannot be empty").max(50, "Legal ID cannot exceed 50 characters"),
    VAT: z.string({ required_error: "VAT number is required" }).min(1, "VAT number cannot be empty").max(15, "VAT number cannot exceed 15 characters").refine((val) => { return /^[A-Z]{2}[0-9A-Z]{8,12}$/.test(val) }, "Invalid VAT number format (e.g., FR12345678901)"),
    foundedAt: z.date().refine((date) => date <= new Date(), "Founded date cannot be in the future"),
    language: z.string({ required_error: "Language is required" }).min(1, "Please select a language"),
    currency: z.string({ required_error: "Currency is required" }).min(1, "Please select a currency"),
    address: z.string().min(1, "Address cannot be empty"),
    postalCode: z.string().refine((val) => { return /^[0-9A-Z\s-]{3,10}$/.test(val) }, "Invalid postal code format"),
    city: z.string().min(1, "City cannot be empty"),
    country: z.string().min(1, "Country cannot be empty"),
    phone: z.string().min(8, "Phone number must be at least 8 characters").refine((val) => { return /^[+]?[0-9\s\-()]{8,20}$/.test(val) }, "Invalid phone number format"),
    email: z.string().email().min(1, "Email is required").refine((val) => { return z.string().email().safeParse(val).success }, "Invalid email format"),
})

export default function CompanySettings() {
    const { data } = useGet<Company>("/api/company/info")
    const { trigger } = usePost<Company>("/api/company/info")

    const [currencySearch, setCurrencySearch] = useState("")
    const [searchedCurrencies, setSearchedCurrencies] = useState<{
        label: string
        value: string
    }[]>([])

    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof companySchema>>({
        resolver: zodResolver(companySchema),
        defaultValues: {
            name: "",
            description: "",
            legalId: "",
            VAT: "",
            foundedAt: new Date(),
            language: "",
            currency: "",
            address: "",
            postalCode: "",
            city: "",
            country: "",
            phone: "",
            email: "",
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

        trigger(values).then(() => {
            toast.success("Company settings updated successfully!")
        }).catch((error) => {
            console.error("Error updating company settings:", error)
        }).finally(() => {
            setIsLoading(false)
        })
    }

    useEffect(() => {
        if (currencies && currencySearch.length < 1) {
            setSearchedCurrencies(
                Object.entries(currencies).map(([code, { name, symbol }]) => ({
                    label: `${name} (${symbol})`,
                    value: code,
                }))
            )
        }
    }, [currencySearch])

    const handleSearchChange = (search: string) => {
        setCurrencySearch(search)
        if (search.length == 0) {
            setSearchedCurrencies(Object.entries(currencies).map(([code, { name, symbol }]) => ({
                label: `${name} (${symbol})`,
                value: code,
            })))
            return
        }

        const filteredCurrencies = Object.entries(currencies)
            .filter(([code, { name, symbol, demonym }]) => {
                const label = `${name} (${symbol})`
                return label.toLowerCase().includes(search.toLowerCase()) || code.toLowerCase().includes(search.toLowerCase()) || symbol.toLowerCase().includes(search.toLowerCase()) || demonym.toLowerCase().includes(search.toLowerCase())
            })
            .map(([code, { name, symbol }]) => ({
                label: `${name} (${symbol})`,
                value: code,
            }))

        setSearchedCurrencies(filteredCurrencies)
    }

    return (
        <div>
            <div className="mb-4">
                <h1 className="text-3xl font-bold">Company Settings</h1>
                <p className="text-muted-foreground">Manage your company information</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Information</CardTitle>
                            <CardDescription>Basic information about your company</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel required>Company Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Your company name" {...field} />
                                            </FormControl>
                                            <FormDescription>This is your company's legal name.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel required>Description</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Brief description of your company" {...field} />
                                            </FormControl>
                                            <FormDescription>Optional description for your company.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="foundedAt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel required>Founded Date</FormLabel>
                                            <FormControl>
                                                <DatePicker
                                                    className="w-full bg-opacity-100"
                                                    value={field.value || null}
                                                    onChange={field.onChange}
                                                    placeholder="Select a date"
                                                />
                                            </FormControl>
                                            <FormDescription>Date your company was founded.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="language"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel required>Language</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a language" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="en">English</SelectItem>
                                                    <SelectItem value="fr">Français</SelectItem>
                                                    <SelectItem value="es">Español</SelectItem>
                                                    <SelectItem value="de">Deutsch</SelectItem>
                                                    <SelectItem value="it">Italiano</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>Default language for your company.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="currency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel required>Currency</FormLabel>
                                            <FormControl>
                                                <SearchSelect
                                                    options={searchedCurrencies}
                                                    allOptions={Object.entries(currencies).map(([code, { name, symbol }]) => ({
                                                        label: `${name} (${symbol})`,
                                                        value: code,
                                                    }))}
                                                    value={field.value}
                                                    onValueChange={(field.onChange)}
                                                    onSearchChange={handleSearchChange}
                                                    placeholder="Select a currency"
                                                    className="w-full"
                                                />
                                            </FormControl>
                                            <FormDescription>Default currency for transactions.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="legalId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel required>Legal ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="123456789" {...field} />
                                            </FormControl>
                                            <FormDescription>Your company's legal identification number. (e.g., SIRET, EIN, etc.)</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="VAT"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel required>VAT Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="FR12345678901" {...field} />
                                            </FormControl>
                                            <FormDescription>Your company's VAT identification number.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Address</CardTitle>
                            <CardDescription>Physical address of your company</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123 Main Street" {...field} />
                                        </FormControl>
                                        <FormDescription>Street address of your company.</FormDescription>
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
                                            <FormLabel required>Postal Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="12345" {...field} />
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
                                            <FormLabel required>City</FormLabel>
                                            <FormControl>
                                                <Input placeholder="New York" {...field} />
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
                                            <FormLabel required>Country</FormLabel>
                                            <Input placeholder="United States" {...field} />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                            <CardDescription>Contact details for your company</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel required>Phone</FormLabel>
                                            <FormControl>
                                                <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
                                            </FormControl>
                                            <FormDescription>Primary phone number for your company.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel required>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="contact@company.com" {...field} />
                                            </FormControl>
                                            <FormDescription>Primary email address for your company.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading} className="min-w-32">
                            {isLoading ? "Saving..." : "Save Settings"}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
