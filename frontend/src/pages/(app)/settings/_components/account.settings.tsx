import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { usePatch } from "@/hooks/use-fetch"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

export default function AccountSettings() {
    const { t } = useTranslation()
    const { trigger: updateUser, loading: updateUserLoading } = usePatch("/api/auth/me")
    const { trigger: updatePassword, loading: updatePasswordLoading } = usePatch("/api/auth/password")
    const { user } = useAuth()

    // Move schemas inside component to access t function
    const profileSchema = z
        .object({
            firstname: z.string().min(1, { message: t("settings.account.form.firstname.errors.required") }),
            lastname: z.string().min(1, { message: t("settings.account.form.lastname.errors.required") }),
            email: z.string().email({ message: t("settings.account.form.email.errors.invalid") }),
        })
        .refine((data) => data.firstname.trim() !== "" && data.lastname.trim() !== "" && data.email.trim() !== "", {
            message: t("settings.account.form.errors.fieldsEmpty"),
        })

    const passwordSchema = z
        .object({
            currentPassword: z.string().min(1, { message: t("settings.account.form.currentPassword.errors.required") }),
            password: z
                .string()
                .min(8, { message: t("settings.account.form.password.errors.minLength") })
                .regex(/[a-zA-Z]/, { message: t("settings.account.form.password.errors.letter") })
                .regex(/[0-9]/, { message: t("settings.account.form.password.errors.number") })
                .regex(/[^a-zA-Z0-9]/, {
                    message: t("settings.account.form.password.errors.special"),
                })
                .trim(),
            confirmPassword: z.string().trim(),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: t("settings.account.form.confirmPassword.errors.match"),
            path: ["confirmPassword"],
        })

    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstname: "",
            lastname: "",
            email: "",
        },
    })

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            password: "",
            confirmPassword: "",
        },
    })

    useEffect(() => {
        if (user) {
            profileForm.reset({
                firstname: user.firstname || "",
                lastname: user.lastname || "",
                email: user.email || "",
            })
        }
    }, [user, profileForm])

    const handleProfileUpdate = async (values: z.infer<typeof profileSchema>) => {
        updateUser({
            firstname: values.firstname,
            lastname: values.lastname,
            email: values.email,
        })
            .then(() => {
                toast.success(t("settings.account.messages.profileUpdateSuccess"))
            })
            .catch((error) => {
                console.error("Error updating profile:", error)
                toast.error(t("settings.account.messages.profileUpdateError"))
            })
    }

    const handlePasswordUpdate = async (values: z.infer<typeof passwordSchema>) => {
        updatePassword({
            currentPassword: values.currentPassword,
            newPassword: values.password,
        })
            .then(() => {
                toast.success(t("settings.account.messages.passwordUpdateSuccess"))
                passwordForm.reset()
            })
            .catch((error) => {
                console.error("Error updating password:", error)
                toast.error(t("settings.account.messages.passwordUpdateError"))
            })
    }

    return (
        <div>
            <div className="mb-4">
                <h1 className="text-3xl font-bold">{t("settings.account.title")}</h1>
                <p className="text-muted-foreground">{t("settings.account.description")}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>{t("settings.account.profile.title")}</CardTitle>
                        <CardDescription>{t("settings.account.profile.description")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
                                <FormField
                                    control={profileForm.control}
                                    name="firstname"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("settings.account.form.firstname.label")}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t("settings.account.form.firstname.placeholder")} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={profileForm.control}
                                    name="lastname"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("settings.account.form.lastname.label")}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t("settings.account.form.lastname.placeholder")} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={profileForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("settings.account.form.email.label")}</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder={t("settings.account.form.email.placeholder")} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" disabled={updateUserLoading}>
                                    {updateUserLoading
                                        ? t("settings.account.form.updatingProfile")
                                        : t("settings.account.form.updateProfile")}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>{t("settings.account.password.title")}</CardTitle>
                        <CardDescription>{t("settings.account.password.description")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-4">
                                <FormField
                                    control={passwordForm.control}
                                    name="currentPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("settings.account.form.currentPassword.label")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder={t("settings.account.form.currentPassword.placeholder")}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={passwordForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("settings.account.form.password.label")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder={t("settings.account.form.password.placeholder")}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={passwordForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("settings.account.form.confirmPassword.label")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder={t("settings.account.form.confirmPassword.placeholder")}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" disabled={updatePasswordLoading}>
                                    {updatePasswordLoading
                                        ? t("settings.account.form.updatingPassword")
                                        : t("settings.account.form.updatePassword")}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
