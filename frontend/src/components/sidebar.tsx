import { ChevronUp, FileSignature, FileText, LayoutDashboard, Moon, Settings, Sun, User, Users } from "lucide-react"
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

import { Button } from "./ui/button"
import { useAuth } from "@/contexts/auth"
import { useEffect } from "react"
import { useTheme } from "./theme-provider"

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
    const { theme, setTheme } = useTheme()

    useEffect(() => {
        console.log(user)
    }, [user])

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light")
    }

    useEffect(() => {
        console.log(user)
    }, [user])

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
                                <Button variant="outline" size="icon">
                                    <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                                    <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                                    <span className="sr-only">Toggle theme</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setTheme("light")}>
                                    Light
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("dark")}>
                                    Dark
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("system")}>
                                    System
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
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
                                <DropdownMenuItem asChild >
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