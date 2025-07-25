import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type React from "react"
import { toast } from "sonner"
import { useNavigate } from "react-router"
import { usePost } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { z } from "zod"

interface LoginResponse {
    user: {
        id: string
        firstname: string
        lastname: string
        email: string
    }
}

export default function LoginPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [errors, setErrors] = useState<Record<string, string[]>>({})
    const { trigger: post, loading, data, error } = usePost<LoginResponse>("/api/auth/login")
    const [hasToasted, setHasToasted] = useState(false)


    // Move schema inside component to access t function
    const loginSchema = z.object({
        email: z.string().email(t("auth.login.errors.invalidEmail")),
        password: z.string().min(1, t("auth.login.errors.passwordRequired")),
    })

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const formData = new FormData(event.currentTarget)
        const data = {
            email: formData.get("email") as string,
            password: formData.get("password") as string,
        }

        const parsed = loginSchema.safeParse(data)

        if (!parsed.success) {
            const fieldErrors: Record<string, string[]> = {}
            for (const issue of parsed.error.issues) {
                const key = issue.path[0] as string
                if (!fieldErrors[key]) fieldErrors[key] = []
                fieldErrors[key].push(issue.message)
            }
            setErrors(fieldErrors)
            return
        }

        setErrors({})
        post(data)
    }

    useEffect(() => {
        if (data && !error && !hasToasted) {
            setHasToasted(true)
            setTimeout(() => {
                console.log("Login successful, redirecting to home")
                window.location.href = "/"
                console.log("Data received:", data)
            }, 1000)
            toast.success(t("auth.login.messages.loginSuccess"))
        } else if (error) {
            toast.error(t("auth.login.messages.loginError"))
        }
    }, [data, error, navigate, t, hasToasted])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <Card className="w-full max-w-sm md:max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">{t("auth.login.title")}</CardTitle>
                    <CardDescription className="text-center">{t("auth.login.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">{t("auth.login.form.email.label")}</Label>
                            <Input id="email" name="email" type="email" disabled={loading} />
                            {errors.email && <p className="text-sm text-red-600">{errors.email[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{t("auth.login.form.password.label")}</Label>
                            <Input id="password" name="password" type="password" disabled={loading} />
                            {errors.password && <p className="text-sm text-red-600">{errors.password[0]}</p>}
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? t("auth.login.form.loggingIn") : t("auth.login.form.loginButton")}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        {t("auth.login.noAccount")}{" "}
                        <button onClick={() => navigate("/signup")} className="underline hover:text-primary">
                            {t("auth.login.signUpLink")}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
