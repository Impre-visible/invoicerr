"use client"

import { AlertTriangle, Database, Loader2, RotateCcw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type React from "react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth"
import { useNavigate } from "react-router"
import { usePost } from "@/lib/utils"
import { useState } from "react"

export default function DangerZoneSettings() {
    const [currentAction, setCurrentAction] = useState<"app" | "all" | null>(null)
    const [otp, setOtp] = useState("")
    const { trigger: sendOTP, loading: isLoadingOtp } = usePost("/api/danger/otp")
    const { trigger: sendAction } = usePost(`/api/danger/reset/${currentAction}?otp=${otp}`)
    const [otpModalOpen, setOtpModalOpen] = useState(false)

    const { logout } = useAuth()
    const navigate = useNavigate()

    const requestOtp = (action: "app" | "all") => {
        setCurrentAction(action)
        setOtpModalOpen(true)
        setOtp("")

        sendOTP()
            .then(() => {
                toast.success("OTP sent successfully. Please check your email.")
            })
            .catch((error) => {
                toast.error("Failed to send OTP. Please try again later.", {
                    description: error instanceof Error ? error.message : "An unexpected error occurred.",
                })
            })
    }

    const executeReset = () => {
        if (!currentAction || !otp) return

        sendAction({ otp }).then((d) => {
            if (!d) {
                throw new Error("Failed to execute action. Please try again.")
            }
            toast.success("Action executed successfully.")
            setOtpModalOpen(false)
            setOtp("")
            setCurrentAction(null)
            if (currentAction === "all") {
                logout()
            } else {
                navigate("/dashboard")
            }
        }).catch((error) => {
            toast.error("Error while executing action.", {
                description: error instanceof Error ? error.message : "An unexpected error occurred.",
            })
        })
    }

    const formatOtp = (value: string) => {
        const cleaned = value.replace(/\D/g, "").slice(0, 8)
        if (cleaned.length <= 4) return cleaned
        return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`
    }

    const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOtp(formatOtp(e.target.value))
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Danger Zone</h1>
                <p className="text-muted-foreground">Do irreversible actions with caution.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Reset App Card */}
                <Card className="border-orange-200 dark:border-orange-900/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-lg">
                            <RotateCcw className="h-4 w-4" />
                            Reset App Data
                        </CardTitle>
                        <CardDescription className="text-sm">Remove all content while preserving user accounts</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <Button
                            variant="outline"
                            className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-900/50 dark:text-orange-400 dark:hover:bg-orange-950/50 bg-transparent"
                            onClick={() => requestOtp("app")}
                            loading={isLoadingOtp}
                        >
                            Reset Application
                        </Button>
                    </CardContent>
                </Card>

                {/* Reset Database Card */}
                <Card className="border-red-200 dark:border-red-900/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400 text-lg">
                            <Database className="h-4 w-4" />
                            Reset Database
                        </CardTitle>
                        <CardDescription className="text-sm">Completely wipe everything including all accounts</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <Button
                            variant="outline"
                            className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/50 bg-transparent"
                            onClick={() => requestOtp("all")}
                            disabled={isLoadingOtp}
                        >
                            {isLoadingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                            Reset Everything
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* OTP Modal */}
            <Dialog open={otpModalOpen} onOpenChange={setOtpModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Verify Action
                        </DialogTitle>
                        <DialogDescription>
                            Enter the 8-digit verification code sent to your email to confirm this dangerous action.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="otp">Verification Code</Label>
                            <Input
                                id="otp"
                                value={otp}
                                onChange={handleOtpChange}
                                placeholder="XXXX-XXXX"
                                className="text-center text-lg font-mono tracking-wider"
                                maxLength={9}
                            />
                        </div>
                        {currentAction && (
                            <div className="bg-muted p-3 rounded-lg">
                                <p className="text-sm font-medium">
                                    {currentAction === "app" ? "⚠️ Reset Application Data" : "🚨 Reset Entire Database"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {currentAction === "app"
                                        ? "This will remove all content but preserve user accounts"
                                        : "This will permanently delete EVERYTHING including all accounts"}
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOtpModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={executeReset} disabled={otp.length !== 9}>
                            Confirm Reset
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
