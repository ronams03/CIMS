"use client"

import { useState } from "react"
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
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Shield,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

// ── Types ──────────────────────────────────────────────────────────────────────

interface PersistentWinner {
  contractor: { id: string; name: string }
  winRate: number
  totalValue: number
  contractCount: number
}

interface RecentQ4Contract {
  id: string
  contractId: string
  title: string
  awardDate: string
  totalObligated: number
  awardMethod: string
  agency: { name: string } | null
  primeContractor: { name: string } | null
}

interface ScopeCreepContract {
  id: string
  contractId: string
  title: string
  awardDate: string
  totalObligated: number
  initialValue: number
  awardMethod: string
  growthPercentage: number
  modifications: {
    id: string
    modNumber: number
    description: string
    valueChange: number
    date: string
  }[]
}

interface PatternsData {
  persistentWinners: Record<string, PersistentWinner[]>
  timingAnalysis: {
    q4Contracts: number
    decemberContracts: number
    q4Percentage: number
    decemberPercentage: number
    quarterlyDistribution: Record<string, number>
    endOfYearSpike: boolean
    recentQ4Contracts: RecentQ4Contract[]
  }
  scopeCreep: {
    count: number
    contracts: ScopeCreepContract[]
  }
  awardMethodDistribution: {
    overTime: Record<string, Record<string, number>>
    overall: { awardMethod: string; count: number }[]
  }
  soleSource: {
    count: number
    percentage: number
    totalContracts: number
  }
}

// ── Chart configs ──────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  defense: "hsl(160, 60%, 45%)",
  IT: "hsl(173, 58%, 39%)",
  construction: "hsl(150, 50%, 50%)",
  healthcare: "hsl(140, 40%, 55%)",
  consulting: "hsl(185, 55%, 35%)",
  logistics: "hsl(130, 45%, 48%)",
  other: "hsl(170, 50%, 42%)",
}

const quarterlyChartConfig: ChartConfig = {
  count: { label: "Contracts" },
  Q1: { label: "Q1", color: "hsl(160, 60%, 45%)" },
  Q2: { label: "Q2", color: "hsl(173, 58%, 39%)" },
  Q3: { label: "Q3", color: "hsl(150, 50%, 50%)" },
  Q4: { label: "Q4", color: "hsl(35, 90%, 50%)" },
}

const awardMethodPieConfig: ChartConfig = {
  count: { label: "Contracts" },
  competitive: { label: "Competitive", color: "hsl(160, 60%, 45%)" },
  "sole-source": { label: "Sole Source", color: "hsl(35, 90%, 50%)" },
  negotiated: { label: "Negotiated", color: "hsl(173, 58%, 39%)" },
  other: { label: "Other", color: "hsl(140, 40%, 55%)" },
}

const PIE_COLORS = [
  "hsl(160, 60%, 45%)",
  "hsl(35, 90%, 50%)",
  "hsl(173, 58%, 39%)",
  "hsl(150, 50%, 50%)",
  "hsl(140, 40%, 55%)",
  "hsl(185, 55%, 35%)",
  "hsl(130, 45%, 48%)",
  "hsl(170, 50%, 42%)",
]

// ── Formatters ─────────────────────────────────────────────────────────────────

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const shortCurrencyFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 1,
})

function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

function formatShortCurrency(value: number) {
  return shortCurrencyFormatter.format(value)
}

function getCategoryColor(category: string, index: number): string {
  const normalizedKey = category.toLowerCase().replace(/[\s-]/g, "")
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (normalizedKey.includes(key.toLowerCase())) return color
  }
  return PIE_COLORS[index % PIE_COLORS.length]
}

// ── KPI Card ───────────────────────────────────────────────────────────────────

function PatternKPICard({
  title,
  value,
  icon: Icon,
  description,
  accentClass,
}: {
  title: string
  value: string
  icon: React.ElementType
  description: string
  accentClass?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`size-4 ${accentClass ?? "text-emerald-600"}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${accentClass ?? ""}`}>{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

// ── Loading Skeleton ───────────────────────────────────────────────────────────

function PatternsSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Persistent Winners + Timing */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-52" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Scope Creep */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-52" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>

      {/* Award Method */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

// ── Scope Creep Row (with Collapsible modifications) ───────────────────────────

function ScopeCreepRow({ contract }: { contract: ScopeCreepContract }) {
  const [open, setOpen] = useState(false)
  const growthColor =
    contract.growthPercentage > 50
      ? "text-red-600 dark:text-red-400"
      : contract.growthPercentage > 30
        ? "text-orange-600 dark:text-orange-400"
        : "text-emerald-600 dark:text-emerald-400"

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <TableRow>
        <TableCell className="font-mono text-xs truncate max-w-[100px]">{contract.contractId}</TableCell>
        <TableCell className="font-medium max-w-[180px] truncate">{contract.title}</TableCell>
        <TableCell className="text-right">{formatCurrency(contract.initialValue)}</TableCell>
        <TableCell className="text-right">{formatCurrency(contract.totalObligated)}</TableCell>
        <TableCell className={`text-right font-semibold ${growthColor}`}>
          <span className="inline-flex items-center gap-1">
            +{contract.growthPercentage.toFixed(1)}%
            <ArrowUpRight className="size-3" />
          </span>
        </TableCell>
        <TableCell className="text-center">{contract.modifications.length}</TableCell>
        <TableCell>
          <CollapsibleTrigger asChild>
            <button
              className="inline-flex items-center justify-center rounded-md p-1 hover:bg-muted transition-colors"
              aria-label={open ? "Hide modifications" : "Show modifications"}
            >
              {open ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>
        </TableCell>
      </TableRow>
      <CollapsibleContent asChild>
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/30 p-0">
            <div className="px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Modification History
              </p>
              <div className="space-y-2">
                {contract.modifications.map((mod) => (
                  <div
                    key={mod.id}
                    className="flex items-center justify-between text-xs border rounded-md p-2"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        Mod #{mod.modNumber}
                      </Badge>
                      <span className="text-muted-foreground">
                        {mod.description || "No description"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        {new Date(mod.date).toLocaleDateString()}
                      </span>
                      <span
                        className={
                          mod.valueChange >= 0
                            ? "text-red-600 dark:text-red-400 font-medium"
                            : "text-emerald-600 dark:text-emerald-400 font-medium"
                        }
                      >
                        {mod.valueChange >= 0 ? "+" : ""}
                        {formatCurrency(mod.valueChange)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TableCell>
        </TableRow>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function PatternsView() {
  const { data, isLoading, error } = useQuery<PatternsData>({
    queryKey: ["patterns"],
    queryFn: async () => {
      const res = await fetch("/api/patterns")
      if (!res.ok) throw new Error("Failed to fetch pattern analysis")
      return res.json()
    },
  })

  if (isLoading) return <PatternsSkeleton />

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-5" />
          <p>Failed to load pattern analysis. Please try again later.</p>
        </div>
      </Card>
    )
  }

  if (!data) return null

  // ── Derived values ────────────────────────────────────────────────────────

  const avgGrowthRate =
    data.scopeCreep.contracts.length > 0
      ? data.scopeCreep.contracts.reduce((sum, c) => sum + c.growthPercentage, 0) /
        data.scopeCreep.contracts.length
      : 0

  const soleSourceAccent =
    data.soleSource.percentage > 20 ? "text-orange-600 dark:text-orange-400" : ""

  const q4Accent = data.timingAnalysis.endOfYearSpike
    ? "text-amber-600 dark:text-amber-400"
    : ""

  // Flatten persistent winners into chart data per category
  const winnerCategories = Object.keys(data.persistentWinners)
  const winnerChartData = winnerCategories.flatMap((category) =>
    data.persistentWinners[category].map((w) => ({
      category,
      name: w.contractor.name,
      winRate: w.winRate,
      totalValue: w.totalValue,
      contractCount: w.contractCount,
      fill: getCategoryColor(category, winnerCategories.indexOf(category)),
    }))
  )

  // Quarterly distribution chart data
  const quarterlyData = Object.entries(data.timingAnalysis.quarterlyDistribution).map(
    ([q, count]) => ({
      quarter: q,
      count,
      fill: q === "Q4" && data.timingAnalysis.endOfYearSpike ? "hsl(35, 90%, 50%)" : "hsl(160, 60%, 45%)",
    })
  )

  // Award method pie data
  const totalMethodCount = data.awardMethodDistribution.overall.reduce(
    (sum, m) => sum + m.count,
    0
  )
  const awardMethodPieData = data.awardMethodDistribution.overall.map((m, i) => ({
    method: m.awardMethod,
    count: m.count,
    percentage: totalMethodCount > 0 ? ((m.count / totalMethodCount) * 100).toFixed(1) : "0",
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }))

  // Build dynamic chart config for pie
  const dynamicPieConfig: ChartConfig = { count: { label: "Contracts" } }
  for (const m of data.awardMethodDistribution.overall) {
    const key = m.awardMethod.toLowerCase().replace(/[\s-]/g, "")
    const existingKey = Object.keys(awardMethodPieConfig).find(
      (k) => k.toLowerCase() === key
    )
    if (existingKey) {
      dynamicPieConfig[key] = awardMethodPieConfig[existingKey]
    } else {
      dynamicPieConfig[key] = {
        label: m.awardMethod,
        color: PIE_COLORS[data.awardMethodDistribution.overall.indexOf(m) % PIE_COLORS.length],
      }
    }
  }

  // Persistent winners chart config (dynamic per category)
  const winnersChartConfig: ChartConfig = {
    winRate: { label: "Win Rate %" },
    name: { label: "Contractor" },
  }
  for (const [idx, category] of winnerCategories.entries()) {
    const key = category.toLowerCase().replace(/[\s-]/g, "")
    winnersChartConfig[key] = {
      label: category,
      color: getCategoryColor(category, idx),
    }
  }

  return (
    <div className="space-y-6">
      {/* ── KPI Cards Row ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PatternKPICard
          title="Sole-Source Rate"
          value={`${data.soleSource.percentage.toFixed(1)}%`}
          icon={Shield}
          description={`${data.soleSource.count} of ${data.soleSource.totalContracts} contracts`}
          accentClass={soleSourceAccent}
        />
        <PatternKPICard
          title="Q4 Award Spike"
          value={`${data.timingAnalysis.q4Percentage.toFixed(1)}%`}
          icon={Clock}
          description={`of awards in Q4 ${data.timingAnalysis.endOfYearSpike ? "(spike detected)" : ""}`}
          accentClass={q4Accent}
        />
        <PatternKPICard
          title="Scope Creep Cases"
          value={`${data.scopeCreep.count}`}
          icon={AlertTriangle}
          description="contracts with >30% growth"
          accentClass={data.scopeCreep.count > 0 ? "text-orange-600 dark:text-orange-400" : ""}
        />
        <PatternKPICard
          title="Avg. Growth Rate"
          value={`${avgGrowthRate.toFixed(1)}%`}
          icon={TrendingUp}
          description="across scope creep contracts"
          accentClass={avgGrowthRate > 50 ? "text-red-600 dark:text-red-400" : avgGrowthRate > 30 ? "text-orange-600 dark:text-orange-400" : ""}
        />
      </div>

      {/* ── Persistent Winners + Timing Analysis ───────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Persistent Winners */}
        <Card className="overflow-hidden min-w-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-emerald-600" />
              <CardTitle className="text-base">Persistent Winners</CardTitle>
            </div>
            <CardDescription>
              Top contractors by category with highest win rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={winnerCategories.slice(0, 2)} className="w-full">
              {winnerCategories.map((category, catIdx) => {
                const winners = data.persistentWinners[category]
                const barData = winners.map((w) => ({
                  name: w.contractor.name.length > 20
                    ? w.contractor.name.slice(0, 18) + "..."
                    : w.contractor.name,
                  winRate: w.winRate,
                  totalValue: w.totalValue,
                  fill: getCategoryColor(category, catIdx),
                }))

                return (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <div
                          className="size-3 rounded-sm shrink-0"
                          style={{ backgroundColor: getCategoryColor(category, catIdx) }}
                        />
                        <span className="font-medium text-sm">{category}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5">
                          {winners.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="min-w-0">
                      <ChartContainer
                        config={winnersChartConfig}
                        className="h-[180px] w-full"
                      >
                        <BarChart
                          data={barData}
                          layout="vertical"
                          margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                        >
                          <XAxis type="number" unit="%" tick={{ fontSize: 11 }} />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={130}
                            tick={{ fontSize: 11 }}
                          />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                formatter={(value, name, item) => (
                                  <div className="space-y-1">
                                    <div>
                                      Win Rate: <span className="font-mono font-medium">{value}%</span>
                                    </div>
                                    <div>
                                      Total Value:{" "}
                                      <span className="font-mono font-medium">
                                        {formatCurrency(item.payload.totalValue)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              />
                            }
                          />
                          <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
                            {barData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                      {/* Contractor details list */}
                      <div className="mt-3 space-y-1.5">
                        {winners.map((w, wIdx) => (
                          <div
                            key={`${w.contractor.id}-${wIdx}`}
                            className="flex items-center justify-between text-xs py-1"
                          >
                            <span className="text-muted-foreground truncate max-w-[160px]">
                              {w.contractor.name}
                            </span>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-medium">{w.winRate}%</span>
                              <span className="text-muted-foreground">
                                {formatShortCurrency(w.totalValue)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </CardContent>
        </Card>

        {/* Timing Analysis */}
        <Card className="overflow-hidden min-w-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-emerald-600" />
              <CardTitle className="text-base">Timing Analysis</CardTitle>
            </div>
            <CardDescription>
              Quarterly distribution of contract awards
              {data.timingAnalysis.endOfYearSpike && (
                <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  End-of-Year Spike
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={quarterlyChartConfig} className="h-[200px] w-full">
              <BarChart
                data={quarterlyData}
                margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
              >
                <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {quarterlyData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>

            {/* Summary stats */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Q4 Contracts</p>
                <p className={`text-lg font-bold ${data.timingAnalysis.endOfYearSpike ? "text-amber-600 dark:text-amber-400" : ""}`}>
                  {data.timingAnalysis.q4Contracts}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    ({data.timingAnalysis.q4Percentage.toFixed(1)}%)
                  </span>
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">December Contracts</p>
                <p className="text-lg font-bold">
                  {data.timingAnalysis.decemberContracts}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    ({data.timingAnalysis.decemberPercentage.toFixed(1)}%)
                  </span>
                </p>
              </div>
            </div>

            {/* Recent Q4 / December contracts */}
            {data.timingAnalysis.recentQ4Contracts.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Recent Q4 Contracts
                </p>
                <div className="max-h-40 overflow-y-auto overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="h-8 text-[11px]">ID</TableHead>
                        <TableHead className="h-8 text-[11px]">Title</TableHead>
                        <TableHead className="h-8 text-[11px] text-right">Value</TableHead>
                        <TableHead className="h-8 text-[11px]">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.timingAnalysis.recentQ4Contracts.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-mono text-[11px] py-1">
                            {c.contractId}
                          </TableCell>
                          <TableCell className="text-[11px] py-1 max-w-[140px] truncate">
                            {c.title}
                          </TableCell>
                          <TableCell className="text-[11px] py-1 text-right">
                            {formatShortCurrency(c.totalObligated)}
                          </TableCell>
                          <TableCell className="text-[11px] py-1 text-muted-foreground">
                            {new Date(c.awardDate).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Scope Creep Section ────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-orange-600 dark:text-orange-400" />
            <CardTitle className="text-base">Scope Creep Detection</CardTitle>
          </div>
          <CardDescription>
            Contracts with &gt;30% value growth from original award
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.scopeCreep.contracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="size-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No scope creep detected in current contracts.</p>
            </div>
          ) : (
            <>
              {/* Overview bar */}
              <div className="mb-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Severity distribution</span>
                    <span>
                      {data.scopeCreep.contracts.filter((c) => c.growthPercentage > 50).length} severe
                      ({"≥"}50%) /{" "}
                      {data.scopeCreep.contracts.filter((c) => c.growthPercentage > 30 && c.growthPercentage <= 50).length}{" "}
                      moderate (30-50%)
                    </span>
                  </div>
                  <Progress
                    value={Math.min(avgGrowthRate, 100)}
                    className="h-2"
                  />
                </div>
              </div>

              {/* Scope Creep Table */}
              <div className="max-h-96 overflow-y-auto overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Contract ID</TableHead>
                      <TableHead className="max-w-[180px]">Title</TableHead>
                      <TableHead className="text-right">Original</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">Growth</TableHead>
                      <TableHead className="text-center w-[60px]">Mods</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.scopeCreep.contracts.map((contract) => (
                      <ScopeCreepRow key={contract.id} contract={contract} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Award Method Distribution ──────────────────────────────────────── */}
      <Card className="overflow-hidden min-w-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-emerald-600" />
            <CardTitle className="text-base">Award Method Distribution</CardTitle>
          </div>
          <CardDescription>
            Breakdown of how contracts are awarded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 items-start min-w-0">
            {/* Pie Chart */}
            <ChartContainer config={dynamicPieConfig} className="h-[280px] w-full">
              <PieChart>
                <Pie
                  data={awardMethodPieData}
                  dataKey="count"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  paddingAngle={2}
                >
                  {awardMethodPieData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, item) => (
                        <div>
                          <span className="font-mono font-medium">{value}</span>
                          {" "}
                          <span className="text-muted-foreground">
                            ({item.payload.percentage}%)
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent nameKey="method" />} />
              </PieChart>
            </ChartContainer>

            {/* Legend with percentages */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Method Breakdown</p>
              {awardMethodPieData.map((m, i) => (
                <div
                  key={m.method}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="size-3 rounded-sm shrink-0"
                      style={{ backgroundColor: m.fill }}
                    />
                    <span className="text-sm font-medium">{m.method}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {m.count} contract{m.count !== 1 ? "s" : ""}
                    </span>
                    <Badge variant="secondary" className="font-mono">
                      {m.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}

              {/* Sole-source highlight */}
              {data.soleSource.percentage > 20 && (
                <div className="mt-2 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900/50 dark:bg-orange-950/20">
                  <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <AlertTriangle className="size-4" />
                    <span className="text-sm font-medium">
                      High sole-source rate ({data.soleSource.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">
                    Above the 20% threshold — consider reviewing sole-source justification practices.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
