"use client"

import { useState } from "react"
import { Search } from "lucide-react"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar, type NavView } from "@/components/app-sidebar"
import { DashboardView } from "@/components/dashboard-view"
import { ContractsView } from "@/components/contracts-view"
import { PatternsView } from "@/components/patterns-view"
import { RelationshipsView } from "@/components/relationships-view"
import { RiskSignalsView } from "@/components/risk-signals-view"
import { MarketView } from "@/components/market-view"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

const viewTitles: Record<NavView, string> = {
  dashboard: "Dashboard",
  contracts: "Contract Database",
  patterns: "Pattern Detection",
  relationships: "Relationship Mapping",
  "risk-signals": "Risk Signals",
  market: "Market Intelligence",
}

function ViewContent({ activeView }: { activeView: NavView }) {
  switch (activeView) {
    case "dashboard":
      return <DashboardView />
    case "contracts":
      return <ContractsView />
    case "patterns":
      return <PatternsView />
    case "relationships":
      return <RelationshipsView />
    case "risk-signals":
      return <RiskSignalsView />
    case "market":
      return <MarketView />
    default:
      return <DashboardView />
  }
}

export default function Home() {
  const [activeView, setActiveView] = useState<NavView>("dashboard")

  return (
    <SidebarProvider>
      <AppSidebar activeView={activeView} onViewChange={setActiveView} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-sm font-semibold">{viewTitles[activeView]}</h1>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="h-8 w-[200px] lg:w-[300px] pl-8 text-sm"
              />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <ViewContent activeView={activeView} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
