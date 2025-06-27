import { Navigate } from "react-router"
import { useAuth } from "@/contexts/auth"

export default function LoginPage() {
    const { logout } = useAuth()

    logout(); // Clear tokens and user data

    return <Navigate to="/login" />
}
