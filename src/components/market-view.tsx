"use client"

import { useQuery } from "@tanstack/react-query"
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Legend,
} from "recharts"
import {
  BarChart3,
  Trophy,
  Target,
  TrendingUp,
  DollarSign,
  Users,
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
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

// ─── Types ───────────────────────────────────────────────────────────────────

interface MarketShareEntry {
  contractor: {
    id: string
    name: string
    industry: string
  }
  winRate: number
  totalValue: number
  contractCount: number
  period: string
  category: string
}

interface WinRateEntry {
  contractorId: string
  contractorName: string
  industry: string
  category: string
  winRate: number
  totalValue: number
  contractCount: number
  period: string
}

interface ContractorValueEntry {
  contractorId: string
  contractorName: string
  industry: string
  riskScore: number
  totalValue: number
  contractCount: number
}

interface CategoryStat {
  category: string
  totalValue: number
  contractCount: number
  avgValue: number
}

interface MarketData {
  marketShareByCategory: Record<string, MarketShareEntry[]>
  winRateRankings: WinRateEntry[]
  totalContractValueByContractor: ContractorValueEntry[]
  categoryStatistics: CategoryStat[]
}

// ─── Formatters ──────────────────────────────────────────────────────────────

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

// ─── Color Constants ─────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  defense: "hsl(160, 60%, 40%)",
  IT: "hsl(173, 58%, 39%)",
  infrastructure: "hsl(150, 50%, 45%)",
  consulting: "hsl(140, 40%, 50%)",
  health: "hsl(185, 55%, 42%)",
  logistics: "hsl(130, 50%, 48%)",
  energy: "hsl(170, 48%, 44%)",
  education: "hsl(145, 45%, 46%)",
}

const CATEGORY_CARD_ACCENTS: Record<string, string> = {
  defense: "border-l-emerald-500",
  IT: "border-l-teal-500",
  infrastructure: "border-l-amber-500",
  consulting: "border-l-cyan-500",
  health: "border-l-green-500",
  logistics: "border-l-lime-500",
  energy: "border-l-emerald-400",
  education: "border-l-teal-400",
}

const CATEGORY_ICON_COLORS: Record<string, string> = {
  defense: "text-emerald-600",
  IT: "text-teal-600",
  infrastructure: "text-amber-600",
  consulting: "text-cyan-600",
  health: "text-green-600",
  logistics: "text-lime-600",
  energy: "text-emerald-500",
  education: "text-teal-500",
}

function getCategoryColor(category: string, index: number): string {
  return CATEGORY_COLORS[category] ?? `hsl(${160 + index * 15}, 55%, ${40 + index * 3}%)`
}

function getCategoryAccent(category: string): string {
  return CATEGORY_CARD_ACCENTS[category] ?? "border-l-emerald-500"
}

function getCategoryIconColor(category: string): string {
  return CATEGORY_ICON_COLORS[category] ?? "text-emerald-600"
}

function getRiskColor(score: number): string {
  if (score <= 30) return "hsl(160, 60%, 45%)" // emerald/low
  if (score <= 60) return "hsl(45, 80%, 50%)" // amber/medium
  return "hsl(0, 70%, 55%)" // red/high
}

function getRiskLabel(score: number): string {
  if (score <= 30) return "Low"
  if (score <= 60) return "Medium"
  return "High"
}

function getRiskBadgeClass(score: number): string {
  if (score <= 30) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
  if (score <= 60) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
  return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
}

// ─── Chart Configs ───────────────────────────────────────────────────────────

const marketShareChartConfig: ChartConfig = {
  totalValue: { label: "Total Value" },
  winRate: { label: "Win Rate %" },
}

const categoryDistChartConfig: ChartConfig = {
  totalValue: { label: "Total Value" },
  defense: { label: "Defense", color: "hsl(160, 60%, 40%)" },
  IT: { label: "IT", color: "hsl(173, 58%, 39%)" },
  infrastructure: { label: "Infrastructure", color: "hsl(150, 50%, 45%)" },
  consulting: { label: "Consulting", color: "hsl(140, 40%, 50%)" },
  health: { label: "Health", color: "hsl(185, 55%, 42%)" },
  logistics: { label: "Logistics", color: "hsl(130, 50%, 48%)" },
  energy: { label: "Energy", color: "hsl(170, 48%, 44%)" },
  education: { label: "Education", color: "hsl(145, 45%, 46%)" },
}

const contractorValueChartConfig: ChartConfig = {
  totalValue: { label: "Total Value" },
  lowRisk: { label: "Low Risk", color: "hsl(160, 60%, 45%)" },
  medRisk: { label: "Medium Risk", color: "hsl(45, 80%, 50%)" },
  highRisk: { label: "High Risk", color: "hsl(0, 70%, 55%)" },
}

const scatterChartConfig: ChartConfig = {
  winRate: { label: "Win Rate %" },
  totalValue: { label: "Total Value" },
  contractCount: { label: "Contract Count" },
}

// ─── Industry Color Map ─────────────────────────────────────────────────────

const INDUSTRY_COLORS: Record<string, string> = {
  defense: "hsl(160, 60%, 40%)",
  IT: "hsl(173, 58%, 39%)",
  infrastructure: "hsl(45, 80%, 50%)",
  consulting: "hsl(140, 40%, 50%)",
  health: "hsl(185, 55%, 42%)",
  logistics: "hsl(130, 50%, 48%)",
  energy: "hsl(170, 48%, 44%)",
  education: "hsl(150, 50%, 45%)",
  technology: "hsl(173, 58%, 39%)",
  aerospace: "hsl(160, 55%, 38%)",
  construction: "hsl(45, 70%, 48%)",
  unknown: "hsl(0, 0%, 60%)",
}

function getIndustryColor(industry: string): string {
  return INDUSTRY_COLORS[industry] ?? INDUSTRY_COLORS.unknown
}

// ─── Custom Label for Pie Chart ──────────────────────────────────────────────

interface PieLabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
  name: string
}

function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: PieLabelProps) {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 1.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x}
      y={y}
      fill="currentColor"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs fill-muted-foreground"
    >
      {name} ({(percent * 100).toFixed(0)}%)
    </text>
  )
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function MarketViewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Category Overview Cards Skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-l-4 border-l-muted">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-28 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Market Share Tabs Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-emerald-600" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-3 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-9 w-80 mb-4" />
          <Skeleton className="h-[350px] w-full rounded-lg" />
        </CardContent>
      </Card>

      {/* Middle row skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[350px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[350px] w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>

      {/* Win Rate Table Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-56" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Error State ─────────────────────────────────────────────────────────────

function ErrorState() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 text-destructive">
        <Target className="size-5" />
        <p>Failed to load market intelligence data. Please try again later.</p>
      </div>
    </Card>
  )
}

// ─── Category Overview Cards ─────────────────────────────────────────────────

function CategoryOverviewCards({ categories }: { categories: CategoryStat[] }) {
  const icons = [DollarSign, TrendingUp, Users, BarChart3, Target, Trophy, DollarSign, TrendingUp]

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((cat, i) => {
        const Icon = icons[i % icons.length]
        return (
          <Card key={cat.category} className={`border-l-4 ${getCategoryAccent(cat.category)}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">{cat.category}</CardTitle>
              <Icon className={`size-4 ${getCategoryIconColor(cat.category)}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatShortCurrency(cat.totalValue)}</div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-muted-foreground">
                  {cat.contractCount} contract{cat.contractCount !== 1 ? "s" : ""}
                </span>
                <Separator orientation="vertical" className="h-3" />
                <span className="text-xs text-muted-foreground">
                  Avg: {formatShortCurrency(cat.avgValue)}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ─── Market Share by Category (Tabs) ────────────────────────────────────────

function MarketShareByCategory({
  marketShareByCategory,
}: {
  marketShareByCategory: Record<string, MarketShareEntry[]>
}) {
  const categories = Object.keys(marketShareByCategory)
  if (categories.length === 0) return null

  return (
    <Card className="overflow-hidden min-w-0">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-emerald-600" />
          <CardTitle className="text-base">Market Share by Category</CardTitle>
        </div>
        <CardDescription>
          Top contractors by total value within each procurement category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList className="mb-4 flex flex-wrap h-auto gap-1">
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="capitalize text-xs sm:text-sm">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((cat) => {
            const entries = marketShareByCategory[cat] ?? []
            const chartData = entries.slice(0, 8).map((e) => ({
              name: e.contractor.name.length > 20
                ? e.contractor.name.slice(0, 18) + "…"
                : e.contractor.name,
              fullName: e.contractor.name,
              totalValue: e.totalValue,
              winRate: e.winRate,
              contractCount: e.contractCount,
            }))

            return (
              <TabsContent key={cat} value={cat}>
                <div className="grid gap-6 lg:grid-cols-[1fr_280px] min-w-0">
                  {/* Bar Chart */}
                  <ChartContainer
                    config={marketShareChartConfig}
                    className="h-[350px] w-full"
                  >
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                    >
                      <XAxis
                        type="number"
                        tickFormatter={(v) => formatShortCurrency(v)}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={140}
                        tick={{ fontSize: 11 }}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => {
                              if (name === "totalValue") return formatCurrency(value as number)
                              if (name === "winRate") return `${value}%`
                              return String(value)
                            }}
                          />
                        }
                      />
                      <Bar
                        dataKey="totalValue"
                        fill={getCategoryColor(cat, 0)}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ChartContainer>

                  {/* Win Rate side panel */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">Win Rate</h4>
                    <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                      {entries.slice(0, 8).map((e, eIdx) => (
                        <div key={`${e.contractor.id}-${eIdx}`} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium truncate max-w-[160px]">
                              {e.contractor.name}
                            </span>
                            <span className="text-xs font-semibold text-emerald-600">
                              {e.winRate.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={e.winRate} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )
}

// ─── Win Rate Rankings Table ─────────────────────────────────────────────────

function WinRateRankings({ rankings }: { rankings: WinRateEntry[] }) {
  const sorted = [...rankings].sort((a, b) => b.winRate - a.winRate)
  const top20 = sorted.slice(0, 20)

  return (
    <Card className="overflow-hidden min-w-0">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-emerald-600" />
          <CardTitle className="text-base">Win Rate Rankings</CardTitle>
        </div>
        <CardDescription>
          Top 20 contractors ranked by win rate in competitive procurement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Rank</TableHead>
                <TableHead className="max-w-[180px]">Contractor</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="w-[140px]">Win Rate</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Value</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Contracts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top20.map((entry, index) => {
                const rank = index + 1
                const isTop3 = rank <= 3
                const rankBadgeClass =
                  rank === 1
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                    : rank === 2
                      ? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      : rank === 3
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300"
                        : ""

                return (
                  <TableRow key={entry.contractorId} className={isTop3 ? "bg-muted/50" : ""}>
                    <TableCell>
                      {isTop3 ? (
                        <Badge className={rankBadgeClass} variant="secondary">
                          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"} {rank}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">{rank}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium max-w-[180px] truncate">{entry.contractorName}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="capitalize text-xs">
                        {entry.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={entry.winRate} className="h-2 flex-1" />
                        <span className="text-sm font-medium w-12 text-right">
                          {entry.winRate.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell font-mono text-sm">
                      {formatShortCurrency(entry.totalValue)}
                    </TableCell>
                    <TableCell className="text-right hidden lg:table-cell text-sm">
                      {entry.contractCount}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Total Contract Value by Contractor ──────────────────────────────────────

function TotalContractValueByContractor({
  data,
}: {
  data: ContractorValueEntry[]
}) {
  const top15 = [...data].sort((a, b) => b.totalValue - a.totalValue).slice(0, 15)

  const chartData = top15.map((d) => ({
    name: d.contractorName.length > 22
      ? d.contractorName.slice(0, 20) + "…"
      : d.contractorName,
    fullName: d.contractorName,
    totalValue: d.totalValue,
    riskScore: d.riskScore,
    contractCount: d.contractCount,
    fill: getRiskColor(d.riskScore),
  }))

  return (
    <Card className="overflow-hidden min-w-0">
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="size-5 text-emerald-600" />
          <CardTitle className="text-base">Total Contract Value by Contractor</CardTitle>
        </div>
        <CardDescription>
          Top 15 contractors colored by risk score
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={contractorValueChartConfig}
          className="h-[400px] w-full"
        >
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 10, right: 40, top: 5, bottom: 5 }}
          >
            <XAxis
              type="number"
              tickFormatter={(v) => formatShortCurrency(v)}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => {
                    if (name === "totalValue") return formatCurrency(value as number)
                    return String(value)
                  }}
                />
              }
            />
            <Bar dataKey="totalValue" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        {/* Risk Legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "hsl(160, 60%, 45%)" }} />
            <span className="text-xs text-muted-foreground">Low Risk (0-30)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "hsl(45, 80%, 50%)" }} />
            <span className="text-xs text-muted-foreground">Medium Risk (31-60)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "hsl(0, 70%, 55%)" }} />
            <span className="text-xs text-muted-foreground">High Risk (61-100)</span>
          </div>
        </div>

        {/* Risk score badges list */}
        <div className="mt-4 space-y-1 max-h-[200px] overflow-y-auto">
          {top15.map((d) => (
            <div key={d.contractorId} className="flex items-center justify-between text-xs py-1">
              <span className="truncate max-w-[200px] font-medium">{d.contractorName}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{formatShortCurrency(d.totalValue)}</span>
                <Badge className={getRiskBadgeClass(d.riskScore)} variant="secondary">
                  {d.riskScore} - {getRiskLabel(d.riskScore)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Category Value Distribution (Donut) ─────────────────────────────────────

function CategoryValueDistribution({ categories }: { categories: CategoryStat[] }) {
  const totalValue = categories.reduce((sum, c) => sum + c.totalValue, 0)

  const chartData = categories.map((cat, i) => ({
    name: cat.category,
    value: cat.totalValue,
    percentage: totalValue > 0 ? ((cat.totalValue / totalValue) * 100).toFixed(1) : "0",
    fill: getCategoryColor(cat.category, i),
  }))

  // Build dynamic chart config from categories
  const dynamicConfig: ChartConfig = {
    value: { label: "Total Value" },
  }
  categories.forEach((cat, i) => {
    dynamicConfig[cat.category] = {
      label: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
      color: getCategoryColor(cat.category, i),
    }
  })

  return (
    <Card className="overflow-hidden min-w-0">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="size-5 text-emerald-600" />
          <CardTitle className="text-base">Category Value Distribution</CardTitle>
        </div>
        <CardDescription>
          How total procurement spending is distributed across categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={dynamicConfig} className="h-[320px] w-full">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={110}
              innerRadius={55}
              paddingAngle={2}
              label={renderPieLabel}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => {
                    const pct = item.payload?.percentage ?? "0"
                    return `${formatCurrency(value as number)} (${pct}%)`
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// ─── Competitive Positioning Matrix (Scatter) ───────────────────────────────

function CompetitivePositioningMatrix({ rankings }: { rankings: WinRateEntry[] }) {
  const scatterData = rankings.map((r) => ({
    x: r.winRate,
    y: r.totalValue,
    z: Math.max(r.contractCount, 1),
    name: r.contractorName,
    industry: r.industry,
    category: r.category,
    fill: getIndustryColor(r.industry),
  }))

  // Build dynamic legend for industries
  const industries = [...new Set(rankings.map((r) => r.industry))]
  const dynamicConfig: ChartConfig = {
    winRate: { label: "Win Rate %" },
    totalValue: { label: "Total Value" },
  }
  industries.forEach((ind, i) => {
    dynamicConfig[ind] = {
      label: ind.charAt(0).toUpperCase() + ind.slice(1),
      color: getIndustryColor(ind),
    }
  })

  return (
    <Card className="overflow-hidden min-w-0">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="size-5 text-emerald-600" />
          <CardTitle className="text-base">Competitive Positioning Matrix</CardTitle>
        </div>
        <CardDescription>
          Win rate vs. total value — bubble size represents contract count
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={dynamicConfig} className="h-[380px] w-full">
          <ScatterChart margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
            <XAxis
              type="number"
              dataKey="x"
              name="Win Rate"
              unit="%"
              tick={{ fontSize: 11 }}
              label={{ value: "Win Rate (%)", position: "insideBottom", offset: -2, className: "text-xs fill-muted-foreground" }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Total Value"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => formatShortCurrency(v)}
              label={{ value: "Total Value", angle: -90, position: "insideLeft", offset: 10, className: "text-xs fill-muted-foreground" }}
            />
            <ZAxis
              type="number"
              dataKey="z"
              range={[80, 600]}
              name="Contracts"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const data = payload[0].payload as (typeof scatterData)[number]
                return (
                  <div className="border-border/50 bg-background grid min-w-[10rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
                    <div className="font-semibold">{data.name}</div>
                    <div className="text-muted-foreground">Category: <span className="text-foreground capitalize">{data.category}</span></div>
                    <div className="text-muted-foreground">Win Rate: <span className="text-foreground">{data.x.toFixed(1)}%</span></div>
                    <div className="text-muted-foreground">Total Value: <span className="text-foreground">{formatCurrency(data.y)}</span></div>
                    <div className="text-muted-foreground">Contracts: <span className="text-foreground">{data.z}</span></div>
                  </div>
                )
              }}
            />
            <Legend
              content={({ payload }) => {
                if (!payload?.length) return null
                const seen = new Set<string>()
                return (
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                    {payload
                      .filter((item) => {
                        const val = String(item.value)
                        if (seen.has(val)) return false
                        seen.add(val)
                        return true
                      })
                      .map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs">
                          <div
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="capitalize">{item.value}</span>
                        </div>
                      ))}
                  </div>
                )
              }}
            />
            <Scatter data={scatterData} name="Contractors">
              {scatterData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Scatter>
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function MarketView() {
  const { data, isLoading, error } = useQuery<MarketData>({
    queryKey: ["market"],
    queryFn: async () => {
      const res = await fetch("/api/market")
      if (!res.ok) throw new Error("Failed to fetch market intelligence")
      return res.json()
    },
  })

  if (isLoading) return <MarketViewSkeleton />
  if (error) return <ErrorState />
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Section 1: Category Overview Cards */}
      <CategoryOverviewCards categories={data.categoryStatistics} />

      {/* Section 2: Market Share by Category (Tabs) */}
      <MarketShareByCategory marketShareByCategory={data.marketShareByCategory} />

      {/* Sections 3-4: Side by side on large screens */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Section 4: Total Contract Value by Contractor */}
        <TotalContractValueByContractor data={data.totalContractValueByContractor} />

        {/* Section 5: Category Value Distribution */}
        <CategoryValueDistribution categories={data.categoryStatistics} />
      </div>

      {/* Section 3: Win Rate Rankings (full width) */}
      <WinRateRankings rankings={data.winRateRankings} />

      {/* Section 6: Competitive Positioning Matrix */}
      <CompetitivePositioningMatrix rankings={data.winRateRankings} />
    </div>
  )
}
