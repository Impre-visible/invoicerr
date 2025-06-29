import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useNavigate } from "react-router"
import { usePost } from "@/lib/utils"
import { z } from "zod"

const SignupSchema = z.object({
    firstname: z.string().min(2, { message: "First name must be at least 2 characters long." }).trim(),
    lastname: z.string().min(2, { message: "Last name must be at least 2 characters long." }).trim(),
    email: z.string().email({ message: "Please enter a valid email." }).trim(),
    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long." })
        .regex(/[a-zA-Z]/, { message: "Password must contain at least one letter." })
        .regex(/[0-9]/, { message: "Password must contain at least one number." })
        .regex(/[^a-zA-Z0-9]/, {
            message: "Password must contain at least one special character.",
        })
        .trim(),
})

type SignupFormData = z.infer<typeof SignupSchema>

export default function SignupPage() {
    const navigate = useNavigate()
    const [errors, setErrors] = useState<Partial<Record<keyof SignupFormData, string[]>>>({})

    const { trigger: post, loading, data, error } = usePost("/api/auth/signup")

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setErrors({})

        const formData = new FormData(event.currentTarget)
        const data: SignupFormData = {
            firstname: formData.get("firstname") as string,
            lastname: formData.get("lastname") as string,
            email: formData.get("email") as string,
            password: formData.get("password") as string,
        }

        const result = SignupSchema.safeParse(data)

        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors
            setErrors(fieldErrors)
            return
        }

        post(result.data)
    }

    useEffect(() => {
        if (data && !error) {
            toast.success(data.message || "Account created successfully! Redirecting to login...")
            setTimeout(() => {
                navigate("/login")
            }, 1000)
        }
    }, [data, error])

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
                    <CardDescription className="text-center">
                        Enter your information to create a new account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstname">First Name</Label>
                                <Input id="firstname" name="firstname" placeholder="John" disabled={loading} />
                                {errors.firstname && <p className="text-sm text-red-600">{errors.firstname[0]}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastname">Last Name</Label>
                                <Input id="lastname" name="lastname" placeholder="Doe" disabled={loading} />
                                {errors.lastname && <p className="text-sm text-red-600">{errors.lastname[0]}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="john@example.com" disabled={loading} />
                            {errors.email && <p className="text-sm text-red-600">{errors.email[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Enter your password"
                                disabled={loading}
                            />
                            {errors.password && (
                                <div className="space-y-1">
                                    <p className="text-sm text-red-600">Password must:</p>
                                    <ul className="text-sm text-red-600 list-disc list-inside">
                                        {errors.password.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Creating Account..." : "Create Account"}
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm">
                        Already have an account?{" "}
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="underline hover:text-primary cursor-pointer"
                        >
                            Sign in
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
