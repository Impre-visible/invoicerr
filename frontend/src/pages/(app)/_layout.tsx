import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { Outlet } from "react-router";
import { Sidebar } from "@/components/sidebar";

const Layout = () => {
    return (
        <SidebarProvider>
            <section className="flex flex-col min-h-screen h-screen max-h-screen w-full max-w-screen overflow-y-auto overflow-x-hidden">
                <main className="flex flex-1 h-full w-full max-w-screen overflow-y-auto overflow-x-hidden">
                    <Sidebar />
                    <section className="flex flex-col flex-1 h-full w-full max-w-screen overflow-hidden">
                        <header className="p-4 bg-gray-100 border-b">
                            <SidebarTrigger />
                        </header>
                        <section className="verflow-y-auto overflow-x-hidden">
                            <Outlet />
                        </section>
                    </section>
                </main>
            </section>
        </SidebarProvider>
    );
};

export default Layout;