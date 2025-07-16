import {
    Building2,
    ChevronsUpDown,
    FileText,
    LayoutDashboard,
    LogOut,
    Moon,
    ReceiptText,
    Settings,
    Sun,
    User,
    Users,
} from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator } from "@radix-ui/react-dropdown-menu"
import { Link, useLocation, useNavigate } from "react-router"
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
    useSidebar,
} from "@/components/ui/sidebar"

import { Button } from "./ui/button"
import type { Company } from "@/types"
import type React from "react"
import { Skeleton } from "./ui/skeleton"
import { useAuth } from "@/contexts/auth"
import { useEffect } from "react"
import { useGet } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTheme } from "./theme-provider"
import { useTranslation } from "react-i18next"

export function Sidebar() {
    const { t } = useTranslation()
    const { open: isOpen } = useSidebar()
    const isMobile = useIsMobile()
    const location = useLocation()
    const { user, loading: userLoading, logout } = useAuth()
    const { setTheme } = useTheme()
    const { data: company, loading: companyLoading, mutate } = useGet<Company>("/api/company/info")
    const navigate = useNavigate()

    const items: { title: string; icon: React.ReactNode; url: string }[] = [
        {
            title: t("sidebar.navigation.dashboard"),
            icon: <LayoutDashboard className="w-4 h-4" />,
            url: "/dashboard",
        },
        {
            title: t("sidebar.navigation.quotes"),
            icon: <FileText className="w-4 h-4" />,
            url: "/quotes",
        },
        {
            title: t("sidebar.navigation.invoices"),
            icon: <ReceiptText className="w-4 h-4" />,
            url: "/invoices",
        },
        {
            title: t("sidebar.navigation.clients"),
            icon: <Users className="w-4 h-4" />,
            url: "/clients",
        },
        {
            title: t("sidebar.navigation.settings"),
            icon: <Settings className="w-4 h-4" />,
            url: "/settings",
        },
    ]

    useEffect(() => {
        if (!company) {
            mutate()
        }
    }, [location])

    const handleLogout = () => {
        logout()
    }

    return (
        <RootSidebar collapsible="icon">
            <Dialog open={!!company && !company.name && location.pathname !== "/settings/company"}>
                <DialogContent className="[&>button]:hidden">
                    <DialogHeader>
                        <DialogTitle>{t("sidebar.companyDialog.title")}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">{t("sidebar.companyDialog.description")}</p>
                    <DialogFooter>
                        <Button onClick={() => navigate("/settings/company")}>{t("sidebar.companyDialog.goButton")}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <SidebarHeader className="px-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <section className="flex items-center gap-2">
                                <div className="bg-accent text-accent-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <Building2 className="size-4" />
                                </div>
                                {companyLoading ? (
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <Skeleton className="h-3 w-3/4" />
                                        <Skeleton className="h-2 w-1/4 mt-1" />
                                    </div>
                                ) : (
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-medium">{company?.name}</span>
                                        <span className="truncate text-xs">{t("sidebar.company.plan")}</span>
                                    </div>
                                )}
                            </section>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-2">
                <SidebarGroup className="px-0">
                    <SidebarGroupLabel>{t("sidebar.menu")}</SidebarGroupLabel>
                    <SidebarMenu>
                        {items.map((item, index) => (
                            <SidebarMenuItem key={index}>
                                <SidebarMenuButton asChild>
                                    <Link
                                        to={item.url}
                                        className={`flex items-center gap-2 py-6 ${location.pathname.startsWith(item.url) ? "text-sidebar-accent-foreground bg-sidebar-accent" : ""
                                            }`}
                                    >
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
                <SidebarMenu className="flex flex-col gap-2">
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className={`${isOpen ? "ml-2" : ""} w-8 h-8`}>
                                    <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                                    <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                                    <span className="sr-only">{t("sidebar.theme.toggleTheme")}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setTheme("light")}>{t("sidebar.theme.light")}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("dark")}>{t("sidebar.theme.dark")}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("system")}>{t("sidebar.theme.system")}</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger className="cursor-pointer" asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <div className="bg-accent text-accent-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                        <User className="size-4" />
                                    </div>
                                    {userLoading ? (
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <Skeleton className="h-3 w-3/4" />
                                            <Skeleton className="h-2 w-1/2 mt-1" />
                                        </div>
                                    ) : (
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-medium">
                                                {user?.lastname} {user?.firstname}
                                            </span>
                                            <span className="truncate text-xs">{user?.email}</span>
                                        </div>
                                    )}
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                                side={isMobile ? "bottom" : "right"}
                                align="end"
                                sideOffset={12}
                            >
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-medium">
                                                {user?.lastname} {user?.firstname}
                                            </span>
                                            <span className="truncate text-xs">{user?.email}</span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem className="cursor-pointer">
                                        <User className="w-4 h-4" />
                                        {t("sidebar.userMenu.account")}
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                                    <LogOut />
                                    {t("sidebar.userMenu.logout")}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </RootSidebar>
    )
}
