import { ChevronUp, FileSignature, FileText, LayoutDashboard, Settings, User, Users } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Link, useLocation } from "react-router"
import {
    Sidebar as RootSidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

import { useAuth } from "@/contexts/auth"

const items: { title: string, icon: React.ReactNode, url: string }[] = [
    {
        title: "Dashboard",
        icon: <LayoutDashboard className="w-4 h-4" />,
        url: "/dashboard",
    },
    {
        title: "Quotes",
        icon: <FileSignature className="w-4 h-4" />,
        url: "/quotes",
    },
    {
        title: "Invoices",
        icon: <FileText className="w-4 h-4" />,
        url: "/invoices",
    },
    {
        title: "Clients",
        icon: <Users className="w-4 h-4" />,
        url: "/clients",
    },
    {
        title: "Settings",
        icon: <Settings className="w-4 h-4" />,
        url: "/settings",
    },
]

export function Sidebar() {
    const location = useLocation()
    const { user } = useAuth()

    return (
        <RootSidebar collapsible="icon">
            <SidebarHeader >
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                            <img src="/favicon.svg" alt="Invoicerr Logo" className="w-5 h-5" />
                            <h1 className="text-lg font-bold">
                                Invoicerr
                            </h1>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarMenu>
                        {items.map((item, index) => (
                            <SidebarMenuItem key={index}>
                                <SidebarMenuButton asChild>
                                    <Link to={item.url} className={`flex items-center gap-2 ${location.pathname === item.url ? 'text-sidebar-accent-foreground bg-sidebar-accent' : ''}`}>
                                        {item.icon}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton>
                                    <User /> {user?.firstname} {user?.lastname}
                                    <ChevronUp className="ml-auto" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                className="min-w-60 rounded-lg"
                            >
                                <DropdownMenuItem asChild>
                                    <Link to="/settings/account" className="flex items-center gap-2">
                                        <span>Profile</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Link to="/logout" className="flex items-center gap-2">
                                        <span>Logout</span>
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </RootSidebar>
    )
}