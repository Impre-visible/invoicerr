import { Navigate, Outlet, useLocation } from "react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/contexts/auth";

const Layout = () => {
    const { user } = useAuth()
    const location = useLocation();

    const ALLOWED_PATHS = [
        '/signature/[^/]+',
    ]

    if (!user) {
        if (ALLOWED_PATHS.some(path => location.pathname.match(new RegExp(path)))) {
            // Do not redirect if the path matches the allowed paths
        } else {
            return <Navigate to="/login" />
        }
    }

    return (
        <SidebarProvider>
            <section className="flex flex-col min-h-screen h-screen max-h-screen w-full max-w-screen overflow-y-auto overflow-x-hidden">
                <main className="flex flex-1 h-full w-full max-w-screen overflow-y-auto overflow-x-hidden">
                    {user && <Sidebar />}
                    <section className="flex flex-col flex-1 h-full w-full max-w-screen overflow-hidden">
                        <header className="p-4 bg-header border-b">
                            {user && <SidebarTrigger />}
                        </header>
                        <section className="overflow-y-auto overflow-x-hidden">
                            <Outlet />
                        </section>
                    </section>
                </main>
            </section>
        </SidebarProvider>
    );
};

export default Layout;