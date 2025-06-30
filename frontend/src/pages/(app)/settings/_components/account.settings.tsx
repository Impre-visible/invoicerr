import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { usePatch } from "@/lib/utils"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

const profileSchema = z
    .object({
        firstname: z.string().min(1, { message: "First name is required." }),
        lastname: z.string().min(1, { message: "Last name is required." }),
        email: z.string().email({ message: "Invalid email address." }),
    })
    .refine((data) => data.firstname.trim() !== "" && data.lastname.trim() !== "" && data.email.trim() !== "", {
        message: "First name, last name, and email cannot be empty.",
    })

const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, { message: "Current password is required." }),
        password: z
            .string()
            .min(8, { message: "Password must be at least 8 characters long." })
            .regex(/[a-zA-Z]/, { message: "Password must contain at least one letter." })
            .regex(/[0-9]/, { message: "Password must contain at least one number." })
            .regex(/[^a-zA-Z0-9]/, {
                message: "Password must contain at least one special character.",
            })
            .trim(),
        confirmPassword: z.string().trim(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match.",
        path: ["confirmPassword"],
    })

export default function AccountSettings() {
    const { trigger: updateUser, loading: updateUserLoading } = usePatch("/api/auth/me")
    const { trigger: updatePassword, loading: updatePasswordLoading } = usePatch("/api/auth/password")
    const { user } = useAuth()

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
                toast.success("Profile updated successfully!")
            })
            .catch((error) => {
                console.error("Error updating profile:", error)
                toast.error("Failed to update profile. Please try again.")
            })
    }

    const handlePasswordUpdate = async (values: z.infer<typeof passwordSchema>) => {
        updatePassword({
            currentPassword: values.currentPassword,
            newPassword: values.password,
        })
            .then(() => {
                toast.success("Password updated successfully!")
                passwordForm.reset()
            })
            .catch((error) => {
                console.error("Error updating password:", error)
                toast.error("Failed to update password. Please try again.")
            })
    }

    return (
        <div>
            <div className="mb-4">
                <h1 className="text-3xl font-bold">Account Settings</h1>
                <p className="text-muted-foreground">Manage your account details.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Update your personal information.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
                                <FormField
                                    control={profileForm.control}
                                    name="firstname"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter your first name" {...field} />
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
                                            <FormLabel>Last Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter your last name" {...field} />
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
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="Enter your email" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={updateUserLoading}>
                                    {updateUserLoading ? "Updating..." : "Update Profile"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                        <CardDescription>Update your password.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-4">
                                <FormField
                                    control={passwordForm.control}
                                    name="currentPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Current Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Current password" {...field} />
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
                                            <FormLabel>New Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="New password" {...field} />
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
                                            <FormLabel>Confirm New Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Confirm new password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={updatePasswordLoading}>
                                    {updatePasswordLoading ? "Updating..." : "Update Password"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
