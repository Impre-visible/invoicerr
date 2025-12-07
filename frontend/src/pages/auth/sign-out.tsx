import { Navigate } from "react-router"
import { useAuth } from "@/contexts/auth"

export default function LogoutPage() {
    const { logout } = useAuth()
    logout()

    return <Navigate to="/auth/sign-in" />
}
