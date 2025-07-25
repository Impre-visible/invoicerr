import { createContext, useContext, useEffect, useMemo, useState } from "react";

import Loading from "@/pages/_loading/loading";
import { authenticatedFetch } from "@/lib/utils";

interface User {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
}

const AuthContext = createContext<{
    user: User | null;
    loading: boolean;
    logout: () => void;
}>({
    user: null,
    loading: true,
    logout: () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const logout = async () => {
        try {
            await authenticatedFetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/auth/logout`, {
                method: "POST",
            });
            setUser(null);
        } catch (error) {
            console.error("Erreur lors de la déconnexion", error);
        }
    };

    useEffect(() => {
        async function fetchMe() {
            try {
                const res = await authenticatedFetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/auth/me`, {
                    method: "GET",
                });
                if (!res.ok) throw new Error("Non authentifié");
                const payload = await res.json();
                setUser(payload);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        }
        fetchMe();
    }, []);

    const value = useMemo(
        () => ({
            user,
            loading,
            logout,
        }),
        [user, loading]
    );

    return <AuthContext.Provider value={value}>{loading ? <Loading /> : children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);