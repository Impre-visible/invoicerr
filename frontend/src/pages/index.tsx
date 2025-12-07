import { Navigate } from "react-router"
import { useAuth } from "@/contexts/auth"

export default function Home() {
    const { user } = useAuth()
    if (!user) {
        return <Navigate to="/auth/sign-in" />
    }

    return <Navigate to="/dashboard" />
}