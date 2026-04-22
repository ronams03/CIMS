"use client"

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
  FileText,
  DollarSign,
  TrendingUp,
  AlertTriangle,
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface DashboardData {
  kpis: {
    totalContracts: number
    totalValue: number
    avgContractValue: number
    activeRiskSignals: number
  }
  contractsByCategory: { category: string; value: number }[]
  awardMethodDistribution: { method: string; count: number; fill: string }[]
  contractsByStatus: { status: string; count: number; fill: string }[]
  topContractors: { name: string; value: number; contracts: number }[]
  recentContracts: {
    id: string
    title: string
    contractor: string
    value: number
    status: string
    date: string
    category: string
  }[]
  riskSignals: { severity: string; count: number; type: string }[]
}

const categoryChartConfig: ChartConfig = {
  value: {
    label: "Contract Value",
  },
  category: {
    label: "Category",
  },
}

const awardMethodConfig: ChartConfig = {
  count: {
    label: "Contracts",
  },
  openTender: { label: "Open Tender", color: "hsl(160, 60%, 45%)" },
  restricted: { label: "Restricted", color: "hsl(173, 58%, 39%)" },
  negotiated: { label: "Negotiated", color: "hsl(185, 55%, 35%)" },
  competitive: { label: "Competitive Dialogue", color: "hsl(150, 50%, 50%)" },
  other: { label: "Other", color: "hsl(140, 40%, 55%)" },
}

const statusChartConfig: ChartConfig = {
  count: {
    label: "Contracts",
  },
  active: { label: "Active", color: "hsl(160, 60%, 45%)" },
  completed: { label: "Completed", color: "hsl(140, 50%, 50%)" },
  terminated: { label: "Terminated", color: "hsl(0, 70%, 55%)" },
  review: { label: "Under Review", color: "hsl(45, 80%, 50%)" },
}

const topContractorsConfig: ChartConfig = {
  value: {
    label: "Contract Value",
  },
  name: {
    label: "Contractor",
  },
}

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

function KPICard({
  title,
  value,
  icon: Icon,
  description,
  trend,
}: {
  title: string
  value: string
  icon: React.ElementType
  description: string
  trend?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-emerald-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {trend && <span className="text-emerald-600 font-medium">{trend} </span>}
          {description}
        </p>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function DashboardView() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard")
      if (!res.ok) throw new Error("Failed to fetch dashboard data")
      return res.json()
    },
  })

  if (isLoading) return <DashboardSkeleton />

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-5" />
          <p>Failed to load dashboard data. Please try again later.</p>
        </div>
      </Card>
    )
  }

  if (!data) return null

  const severityColors: Record<string, string> = {
    Critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    High: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    Low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  }

  const statusColors: Record<string, string> = {
    Active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    Completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    Terminated: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    "Under Review": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  }

  const CHART_COLORS = [
    "hsl(160, 60%, 45%)",
    "hsl(173, 58%, 39%)",
    "hsl(185, 55%, 35%)",
    "hsl(150, 50%, 50%)",
    "hsl(140, 40%, 55%)",
    "hsl(130, 45%, 48%)",
    "hsl(170, 50%, 42%)",
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Contracts"
          value={data.kpis.totalContracts.toLocaleString()}
          icon={FileText}
          description="in the database"
          trend="+12.3%"
        />
        <KPICard
          title="Total Value"
          value={formatShortCurrency(data.kpis.totalValue)}
          icon={DollarSign}
          description="across all contracts"
          trend="+8.7%"
        />
        <KPICard
          title="Avg. Contract Value"
          value={formatCurrency(data.kpis.avgContractValue)}
          icon={TrendingUp}
          description="per contract"
          trend="-2.1%"
        />
        <KPICard
          title="Active Risk Signals"
          value={data.kpis.activeRiskSignals.toString()}
          icon={AlertTriangle}
          description="requiring attention"
          trend="+5"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Contract Value by Category */}
        <Card className="overflow-hidden min-w-0">
          <CardHeader>
            <CardTitle className="text-base">Contract Value by Category</CardTitle>
            <CardDescription>Distribution of contract spending</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={categoryChartConfig} className="h-[250px] w-full">
              <BarChart
                data={data.contractsByCategory}
                layout="vertical"
                margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
              >
                <XAxis type="number" tickFormatter={(v) => formatShortCurrency(v)} />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(value as number)}
                    />
                  }
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {data.contractsByCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Award Method Distribution */}
        <Card className="overflow-hidden min-w-0">
          <CardHeader>
            <CardTitle className="text-base">Award Method Distribution</CardTitle>
            <CardDescription>How contracts are awarded</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={awardMethodConfig} className="h-[250px] w-full">
              <PieChart>
                <Pie
                  data={data.awardMethodDistribution}
                  dataKey="count"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent nameKey="method" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Contracts by Status */}
        <Card className="overflow-hidden min-w-0">
          <CardHeader>
            <CardTitle className="text-base">Contracts by Status</CardTitle>
            <CardDescription>Current status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusChartConfig} className="h-[250px] w-full">
              <PieChart>
                <Pie
                  data={data.contractsByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent nameKey="status" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Top Contractors + Recent Contracts + Risk Signals */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top 5 Contractors by Value */}
        <Card className="overflow-hidden min-w-0">
          <CardHeader>
            <CardTitle className="text-base">Top 5 Contractors by Value</CardTitle>
            <CardDescription>Highest total contract value</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={topContractorsConfig} className="h-[250px] w-full">
              <BarChart
                data={data.topContractors}
                layout="vertical"
                margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
              >
                <XAxis type="number" tickFormatter={(v) => formatShortCurrency(v)} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(value as number)}
                    />
                  }
                />
                <Bar dataKey="value" fill="hsl(160, 60%, 45%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Risk Signal Summary */}
        <Card className="overflow-hidden min-w-0">
          <CardHeader>
            <CardTitle className="text-base">Risk Signal Summary</CardTitle>
            <CardDescription>By severity and type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.riskSignals.map((signal, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={severityColors[signal.severity] || ""} variant="secondary">
                      {signal.severity}
                    </Badge>
                    <span className="text-sm font-medium">{signal.type}</span>
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {signal.count} {signal.count === 1 ? "signal" : "signals"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Contracts Table */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Recent Contracts</CardTitle>
          <CardDescription>Latest contract awards</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Contractor</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-mono text-xs">{contract.id}</TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">{contract.title}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground max-w-[150px] truncate">
                    {contract.contractor}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatShortCurrency(contract.value)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      className={statusColors[contract.status] || ""}
                      variant="secondary"
                    >
                      {contract.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {contract.category}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {contract.date}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
