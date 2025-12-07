import { Navigate } from "react-router"
import { authClient } from "@/lib/auth"

export default function LogoutPage() {
    authClient.signOut()

    return <Navigate to="/auth/sign-in" />
}
