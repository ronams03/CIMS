"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  AlertTriangle,
  Shield,
  AlertOctagon,
  Clock,
  Eye,
  Filter,
  X,
  Info,
} from "lucide-react"
import { format } from "date-fns"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

// ─── Types ──────────────────────────────────────────────────────────────────

interface RiskSignalContract {
  id: string
  contractId: string
  title: string
  agencyName: string
  contractorName: string
}

interface RiskSignal {
  id: string
  signalType: string
  severity: string
  description: string
  isResolved: boolean
  createdAt: string
  updatedAt: string
  contract: RiskSignalContract
}

interface RiskSignalsData {
  riskSignals: RiskSignal[]
  countByType: Record<string, number>
  countBySeverity: Record<string, number>
  total: number
  filters: {
    severity: string | null
    signalType: string | null
  }
}

// ─── Constants ──────────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const SEVERITY_COLORS: Record<string, { bg: string; text: string; accent: string; chart: string }> = {
  critical: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-400",
    accent: "border-red-500/30 bg-red-50 dark:bg-red-950/40",
    chart: "hsl(0, 72%, 51%)",
  },
  high: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-800 dark:text-orange-400",
    accent: "border-orange-500/30 bg-orange-50 dark:bg-orange-950/40",
    chart: "hsl(25, 95%, 53%)",
  },
  medium: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-800 dark:text-yellow-400",
    accent: "border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/40",
    chart: "hsl(45, 93%, 47%)",
  },
  low: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-800 dark:text-emerald-400",
    accent: "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40",
    chart: "hsl(160, 84%, 39%)",
  },
}

const SEVERITY_ICONS: Record<string, React.ElementType> = {
  critical: AlertOctagon,
  high: AlertTriangle,
  medium: Shield,
  low: Eye,
}

const SIGNAL_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; text: string; description: string }> = {
  "sole-source": {
    label: "Sole Source",
    color: "hsl(25, 95%, 53%)",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-800 dark:text-orange-400",
    description: "Contract awarded without competitive bidding",
  },
  "scope-creep": {
    label: "Scope Creep",
    color: "hsl(0, 72%, 51%)",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-400",
    description: "Contract value grew >30% from initial award",
  },
  "timing-irregularity": {
    label: "Timing Irregularity",
    color: "hsl(45, 93%, 47%)",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-800 dark:text-amber-400",
    description: "Contract awarded during unusual timing patterns",
  },
  "concentration": {
    label: "Concentration",
    color: "hsl(280, 67%, 52%)",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-800 dark:text-purple-400",
    description: "Vendor has disproportionate contract concentration",
  },
}

// ─── Chart Configs ──────────────────────────────────────────────────────────

const typeChartConfig: ChartConfig = {
  count: { label: "Signals" },
  "sole-source": { label: "Sole Source", color: "hsl(25, 95%, 53%)" },
  "scope-creep": { label: "Scope Creep", color: "hsl(0, 72%, 51%)" },
  "timing-irregularity": { label: "Timing Irregularity", color: "hsl(45, 93%, 47%)" },
  concentration: { label: "Concentration", color: "hsl(280, 67%, 52%)" },
}

const severityChartConfig: ChartConfig = {
  count: { label: "Signals" },
  critical: { label: "Critical", color: "hsl(0, 72%, 51%)" },
  high: { label: "High", color: "hsl(25, 95%, 53%)" },
  medium: { label: "Medium", color: "hsl(45, 93%, 47%)" },
  low: { label: "Low", color: "hsl(160, 84%, 39%)" },
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SeveritySummaryCards({ countBySeverity, total }: { countBySeverity: Record<string, number>; total: number }) {
  const severities = ["critical", "high", "medium", "low"] as const

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {severities.map((severity) => {
        const count = countBySeverity[severity] ?? 0
        const colors = SEVERITY_COLORS[severity]
        const Icon = SEVERITY_ICONS[severity]

        return (
          <Card key={severity} className={`border-l-4 ${colors.accent}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">{severity}</CardTitle>
              <Icon className={`size-4 ${colors.text}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {total > 0 ? Math.round((count / total) * 100) : 0}% of all signals
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function FilterBar({
  severityFilter,
  signalTypeFilter,
  onSeverityChange,
  onSignalTypeChange,
  onClearFilters,
}: {
  severityFilter: string
  signalTypeFilter: string
  onSeverityChange: (value: string) => void
  onSignalTypeChange: (value: string) => void
  onClearFilters: () => void
}) {
  const hasFilters = severityFilter !== "all" || signalTypeFilter !== "all"

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="size-4" />
        <span className="font-medium">Filters:</span>
      </div>

      <Select value={severityFilter} onValueChange={onSeverityChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Severity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Severities</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      <Select value={signalTypeFilter} onValueChange={onSignalTypeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Signal Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Signal Types</SelectItem>
          <SelectItem value="sole-source">Sole Source</SelectItem>
          <SelectItem value="scope-creep">Scope Creep</SelectItem>
          <SelectItem value="timing-irregularity">Timing Irregularity</SelectItem>
          <SelectItem value="concentration">Concentration</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClearFilters} className="gap-1.5">
          <X className="size-3.5" />
          Clear Filters
        </Button>
      )}
    </div>
  )
}

function SignalDistributionCharts({
  countByType,
  countBySeverity,
}: {
  countByType: Record<string, number>
  countBySeverity: Record<string, number>
}) {
  // Prepare bar chart data (by type)
  const typeData = Object.entries(countByType).map(([type, count]) => ({
    type,
    label: SIGNAL_TYPE_CONFIG[type]?.label ?? type,
    count,
    fill: SIGNAL_TYPE_CONFIG[type]?.color ?? "hsl(160, 60%, 45%)",
  }))

  // Prepare pie chart data (by severity)
  const severityOrder = ["critical", "high", "medium", "low"] as const
  const severityData = severityOrder
    .filter((s) => (countBySeverity[s] ?? 0) > 0)
    .map((severity) => ({
      severity,
      count: countBySeverity[severity] ?? 0,
      fill: SEVERITY_COLORS[severity].chart,
    }))

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Signals by Type - Horizontal Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signals by Type</CardTitle>
          <CardDescription>Distribution of risk signal categories</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={typeChartConfig} className="h-[250px] w-full">
            <BarChart
              data={typeData}
              layout="vertical"
              margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
            >
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={130}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {typeData.map((entry, index) => (
                  <Cell key={`type-cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Signals by Severity - Donut Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signals by Severity</CardTitle>
          <CardDescription>Severity distribution overview</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={severityChartConfig} className="h-[250px] w-full">
            <PieChart>
              <Pie
                data={severityData}
                dataKey="count"
                nameKey="severity"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                paddingAngle={2}
              >
                {severityData.map((entry, index) => (
                  <Cell key={`sev-cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent nameKey="severity" />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

function RiskSignalCard({ signal }: { signal: RiskSignal }) {
  const severityColors = SEVERITY_COLORS[signal.severity] ?? SEVERITY_COLORS.low
  const signalConfig = SIGNAL_TYPE_CONFIG[signal.signalType]
  const formattedDate = (() => {
    try {
      return format(new Date(signal.createdAt), "MMM d, yyyy")
    } catch {
      return signal.createdAt
    }
  })()

  return (
    <div className="rounded-lg border p-4 space-y-3 transition-colors hover:bg-accent/30">
      {/* Top row: badges + status */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={`${severityColors.bg} ${severityColors.text} border-0`} variant="secondary">
          {signal.severity.charAt(0).toUpperCase() + signal.severity.slice(1)}
        </Badge>
        {signalConfig && (
          <Badge className={`${signalConfig.bg} ${signalConfig.text} border-0`} variant="secondary">
            {signalConfig.label}
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <div
            className={`size-2 rounded-full ${signal.isResolved ? "bg-emerald-500" : "bg-red-500"}`}
          />
          <span className="text-xs text-muted-foreground">
            {signal.isResolved ? "Resolved" : "Unresolved"}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed">{signal.description}</p>

      {/* Contract reference */}
      <div className="text-sm">
        <span className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer">
          {signal.contract.contractId}
        </span>
        <span className="text-muted-foreground"> — {signal.contract.title}</span>
      </div>

      {/* Agency & Contractor */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Shield className="size-3" />
          {signal.contract.agencyName}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {signal.contract.contractorName}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {formattedDate}
        </span>
      </div>
    </div>
  )
}

function RiskSignalsList({ signals }: { signals: RiskSignal[] }) {
  const sortedSignals = useMemo(() => {
    return [...signals].sort((a, b) => {
      const orderA = SEVERITY_ORDER[a.severity] ?? 99
      const orderB = SEVERITY_ORDER[b.severity] ?? 99
      return orderA - orderB
    })
  }, [signals])

  if (sortedSignals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
            <Shield className="size-10 mb-3 opacity-40" />
            <p className="font-medium">No risk signals found</p>
            <p className="text-sm mt-1">Try adjusting your filters to see more results.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-orange-500" />
          <CardTitle className="text-base">Risk Signals</CardTitle>
        </div>
        <CardDescription>
          {sortedSignals.length} signal{sortedSignals.length !== 1 ? "s" : ""} found, sorted by severity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-3 pr-4">
            {sortedSignals.map((signal) => (
              <RiskSignalCard key={signal.id} signal={signal} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function SignalTypeDescriptions() {
  const types = Object.entries(SIGNAL_TYPE_CONFIG)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Info className="size-5 text-muted-foreground" />
          <CardTitle className="text-base">Signal Type Reference</CardTitle>
        </div>
        <CardDescription>
          Understanding each risk signal category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {types.map(([key, config]) => (
            <div key={key} className="flex gap-3 rounded-lg border p-3">
              <div className={`shrink-0 size-2.5 rounded-full mt-1.5 ${config.bg}`} />
              <div>
                <div className="flex items-center gap-2">
                  <Badge className={`${config.bg} ${config.text} border-0`} variant="secondary">
                    {config.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5">{config.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function RiskSignalsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Severity cards skeleton */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {["Critical", "High", "Medium", "Low"].map((label) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-10 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter bar skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-[150px]" />
        <Skeleton className="h-9 w-[180px]" />
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Signals list skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-4">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info section skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function RiskSignalsView() {
  const [severityFilter, setSeverityFilter] = useState("all")
  const [signalTypeFilter, setSignalTypeFilter] = useState("all")

  const queryParams = new URLSearchParams()
  if (severityFilter !== "all") queryParams.set("severity", severityFilter)
  if (signalTypeFilter !== "all") queryParams.set("signalType", signalTypeFilter)

  const queryString = queryParams.toString()
  const url = `/api/risk-signals${queryString ? `?${queryString}` : ""}`

  const { data, isLoading, error } = useQuery<RiskSignalsData>({
    queryKey: ["risk-signals", severityFilter, signalTypeFilter],
    queryFn: async () => {
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch risk signals")
      return res.json()
    },
  })

  if (isLoading) return <RiskSignalsSkeleton />

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-5" />
          <p>Failed to load risk signals. Please try again later.</p>
        </div>
      </Card>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* 1. Severity Summary Cards */}
      <SeveritySummaryCards countBySeverity={data.countBySeverity} total={data.total} />

      {/* 2. Filter Bar */}
      <FilterBar
        severityFilter={severityFilter}
        signalTypeFilter={signalTypeFilter}
        onSeverityChange={setSeverityFilter}
        onSignalTypeChange={setSignalTypeFilter}
        onClearFilters={() => {
          setSeverityFilter("all")
          setSignalTypeFilter("all")
        }}
      />

      {/* 3. Signal Distribution Charts */}
      <SignalDistributionCharts
        countByType={data.countByType}
        countBySeverity={data.countBySeverity}
      />

      {/* 4. Risk Signals List */}
      <RiskSignalsList signals={data.riskSignals} />

      {/* 5. Signal Type Descriptions */}
      <SignalTypeDescriptions />
    </div>
  )
}
