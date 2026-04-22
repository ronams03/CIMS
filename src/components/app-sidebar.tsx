"use client"

import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  Network,
  AlertTriangle,
  BarChart3,
  Search,
  Moon,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

export type NavView = "dashboard" | "contracts" | "patterns" | "relationships" | "risk-signals" | "market"

const navItems = [
  { id: "dashboard" as NavView, label: "Dashboard", icon: LayoutDashboard },
  { id: "contracts" as NavView, label: "Contracts", icon: FileText },
  { id: "patterns" as NavView, label: "Patterns", icon: TrendingUp },
  { id: "relationships" as NavView, label: "Relationships", icon: Network },
  { id: "risk-signals" as NavView, label: "Risk Signals", icon: AlertTriangle },
  { id: "market" as NavView, label: "Market Intel", icon: BarChart3 },
]

interface AppSidebarProps {
  activeView: NavView
  onViewChange: (view: NavView) => void
}

export function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  const { state } = useSidebar()
  const { theme, setTheme } = useTheme()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="ContractSurface">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <FileText className="size-4" />
              </div>
              {state === "expanded" && (
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">ContractSurface</span>
                  <span className="text-xs text-muted-foreground">Contract Intelligence</span>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {state === "expanded" && (
          <div className="flex items-center gap-2 px-2">
            <Search className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Search contracts...</span>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={activeView === item.id}
                  tooltip={item.label}
                  onClick={() => onViewChange(item.id)}
                >
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={theme === "dark" ? "Light Mode" : "Dark Mode"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
