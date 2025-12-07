import { Navigate, Outlet, useLocation } from "react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { Sidebar } from "@/components/sidebar";
import { authClient } from "@/lib/auth";

const Layout = () => {
    const {
        data: session,
        isPending,
    } = authClient.useSession();


    return (
        <SidebarProvider>
            <section className="flex flex-col min-h-screen h-screen max-h-screen w-full max-w-screen overflow-y-auto overflow-x-hidden">
                <main className="flex flex-1 h-full w-full max-w-screen overflow-y-auto overflow-x-hidden">
                    {session && !isPending && <Sidebar />}
                    <section className="flex flex-col flex-1 h-full w-full max-w-screen overflow-hidden">
                        <header className="p-4 bg-header border-b">
                            {session && !isPending && <SidebarTrigger />}
                        </header>
                        <section className="h-full overflow-y-auto overflow-x-hidden">
                            <Outlet />
                        </section>
                    </section>
                </main>
            </section>
        </SidebarProvider>
    );
};

export default Layout;