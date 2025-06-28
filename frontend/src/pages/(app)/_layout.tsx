import { Navigate, Outlet } from "react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/contexts/auth";

const Layout = () => {
    const { accessToken } = useAuth()
    if (!accessToken) {
        return <Navigate to="/login" />
    }

    return (
        <SidebarProvider>
            <section className="flex flex-col min-h-screen h-screen max-h-screen w-full max-w-screen overflow-y-auto overflow-x-hidden">
                <main className="flex flex-1 h-full w-full max-w-screen overflow-y-auto overflow-x-hidden">
                    <Sidebar />
                    <section className="flex flex-col flex-1 h-full w-full max-w-screen overflow-hidden">
                        <header className="p-4 bg-header border-b">
                            <SidebarTrigger />
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