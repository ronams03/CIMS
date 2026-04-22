"use client"

import { useState, useEffect, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FileText,
  DollarSign,
  X,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// ── Types ──────────────────────────────────────────────────────────────────

interface ContractListItem {
  id: string
  contractId: string
  title: string
  description: string
  category: string
  totalObligated: number
  initialValue: number
  awardMethod: string
  status: string
  awardDate: string
  endDate: string | null
  agencyName: string
  agencyCode: string
  primeContractorName: string
  primeContractorId: string
  modificationCount: number
  riskSignalCount: number
}

interface ContractsResponse {
  contracts: ContractListItem[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
  }
}

interface ContractModification {
  id: string
  modNumber: number
  description: string
  valueChange: number
  modDate: string
  reason: string
}

interface SubcontractorLink {
  id: string
  subValue: number
  description: string
  contractor: {
    id: string
    name: string
    registrationId: string
  }
}

interface RiskSignal {
  id: string
  signalType: string
  severity: string
  description: string
  isResolved: boolean
  createdAt: string
}

interface ContractDetail {
  id: string
  contractId: string
  title: string
  description: string
  category: string
  initialValue: number
  totalObligated: number
  awardMethod: string
  status: string
  awardDate: string
  endDate: string | null
  bidDate: string | null
  agency: {
    id: string
    name: string
    code: string
    level: string
    category: string
    budget: number
  }
  primeContractor: {
    id: string
    name: string
    registrationId: string
    type: string
    industry: string
    city: string
    state: string
  }
  modifications: ContractModification[]
  subcontractors: SubcontractorLink[]
  riskSignals: RiskSignal[]
}

// ── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "IT", label: "IT" },
  { value: "defense", label: "Defense" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "consulting", label: "Consulting" },
  { value: "energy", label: "Energy" },
  { value: "aerospace", label: "Aerospace" },
  { value: "security", label: "Security" },
  { value: "health", label: "Health" },
]

const AWARD_METHODS = [
  { value: "competitive", label: "Competitive" },
  { value: "sole-source", label: "Sole Source" },
  { value: "emergency", label: "Emergency" },
]

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "terminated", label: "Terminated" },
  { value: "modified", label: "Modified" },
]

// ── Helpers ────────────────────────────────────────────────────────────────

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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getCategoryBadgeClass(category: string): string {
  return "bg-muted text-muted-foreground"
}

function getAwardMethodBadge(method: string): { className: string; label: string } {
  switch (method) {
    case "competitive":
      return {
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        label: "Competitive",
      }
    case "sole-source":
      return {
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        label: "Sole Source",
      }
    case "emergency":
      return {
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        label: "Emergency",
      }
    default:
      return {
        className: "bg-muted text-muted-foreground",
        label: method,
      }
  }
}

function getStatusBadge(status: string): { className: string; label: string } {
  switch (status) {
    case "active":
      return {
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        label: "Active",
      }
    case "completed":
      return {
        className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
        label: "Completed",
      }
    case "terminated":
      return {
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        label: "Terminated",
      }
    case "modified":
      return {
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        label: "Modified",
      }
    default:
      return {
        className: "bg-muted text-muted-foreground",
        label: status,
      }
  }
}

function getSeverityBadge(severity: string): { className: string; label: string } {
  switch (severity) {
    case "critical":
      return {
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        label: "Critical",
      }
    case "high":
      return {
        className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        label: "High",
      }
    case "medium":
      return {
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        label: "Medium",
      }
    case "low":
      return {
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        label: "Low",
      }
    default:
      return {
        className: "bg-muted text-muted-foreground",
        label: severity,
      }
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ContractsTableSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search bar skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-[140px]" />
        <Skeleton className="h-9 w-[140px]" />
        <Skeleton className="h-9 w-[140px]" />
      </div>

      {/* Stats row skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-40" />
      </div>

      {/* Table skeleton */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden lg:table-cell">Agency</TableHead>
                <TableHead className="hidden md:table-cell">Contractor</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="hidden xl:table-cell">Award Method</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell text-center">Mods</TableHead>
                <TableHead className="text-center">Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell className="hidden xl:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell className="hidden lg:table-cell text-center"><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-4">
          <FileText className="size-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No contracts found</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {hasFilters
            ? "No contracts match your current search criteria. Try adjusting your filters or search terms."
            : "There are no contracts in the database yet."}
        </p>
        {hasFilters && (
          <Button variant="outline" className="mt-4 gap-2" onClick={onClear}>
            <X className="size-4" />
            Clear all filters
          </Button>
        )}
      </div>
    </Card>
  )
}

function ContractDetailDialog({
  contract,
  open,
  onOpenChange,
}: {
  contract: ContractListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data, isLoading } = useQuery<ContractDetail>({
    queryKey: ["contract-detail", contract?.id],
    queryFn: async () => {
      const res = await fetch(`/api/contracts/${contract!.id}`)
      if (!res.ok) throw new Error("Failed to fetch contract details")
      return res.json()
    },
    enabled: open && !!contract?.id,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        {isLoading || !data ? (
          <div className="space-y-4">
            <DialogHeader>
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-40" />
            </DialogHeader>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="font-mono text-sm text-emerald-600">
                  {data.contractId}
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-base">{data.title}</span>
              </DialogTitle>
              <DialogDescription>{data.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              {/* Key details grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Agency</span>
                  <p className="font-medium">{data.agency.name} ({data.agency.code})</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Prime Contractor</span>
                  <p className="font-medium">{data.primeContractor.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Category</span>
                  <p>
                    <Badge variant="secondary" className={getCategoryBadgeClass(data.category)}>
                      {data.category}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Award Method</span>
                  <p>
                    <Badge
                      variant="secondary"
                      className={getAwardMethodBadge(data.awardMethod).className}
                    >
                      {getAwardMethodBadge(data.awardMethod).label}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <p>
                    <Badge
                      variant="secondary"
                      className={getStatusBadge(data.status).className}
                    >
                      {getStatusBadge(data.status).label}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Award Date</span>
                  <p className="font-medium">{formatDate(data.awardDate)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">End Date</span>
                  <p className="font-medium">{formatDate(data.endDate)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Bid Date</span>
                  <p className="font-medium">{formatDate(data.bidDate)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Initial Value</span>
                  <p className="font-medium">{formatCurrency(data.initialValue)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Obligated</span>
                  <p className="font-semibold text-emerald-600">
                    {formatCurrency(data.totalObligated)}
                  </p>
                </div>
              </div>

              {/* Value change indicator */}
              {data.totalObligated !== data.initialValue && (
                <div className="rounded-lg border p-3 text-sm">
                  <span className="text-muted-foreground">Value change from initial: </span>
                  <span
                    className={
                      data.totalObligated > data.initialValue
                        ? "text-emerald-600 font-semibold"
                        : "text-red-600 font-semibold"
                    }
                  >
                    {data.totalObligated > data.initialValue ? "+" : ""}
                    {formatCurrency(data.totalObligated - data.initialValue)}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    ({((data.totalObligated - data.initialValue) / data.initialValue * 100).toFixed(1)}%)
                  </span>
                </div>
              )}

              {/* Modifications */}
              {data.modifications.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <FileText className="size-4 text-emerald-600" />
                      Modifications ({data.modifications.length})
                    </h4>
                    <div className="space-y-2">
                      {data.modifications.map((mod) => (
                        <div
                          key={mod.id}
                          className="flex items-start justify-between rounded-lg border p-3 text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs">
                                Mod #{mod.modNumber}
                              </Badge>
                              <span className="text-muted-foreground">
                                {formatDate(mod.modDate)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm">{mod.description}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Reason: {mod.reason}
                            </p>
                          </div>
                          <span
                            className={`font-semibold ml-4 whitespace-nowrap ${
                              mod.valueChange > 0 ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            {mod.valueChange > 0 ? "+" : ""}
                            {formatCurrency(mod.valueChange)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Subcontractors */}
              {data.subcontractors.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <DollarSign className="size-4 text-emerald-600" />
                      Subcontractors ({data.subcontractors.length})
                    </h4>
                    <div className="space-y-2">
                      {data.subcontractors.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between rounded-lg border p-3 text-sm"
                        >
                          <div>
                            <p className="font-medium">{sub.contractor.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ID: {sub.contractor.registrationId}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {sub.description}
                            </p>
                          </div>
                          <span className="font-semibold ml-4 whitespace-nowrap">
                            {formatCurrency(sub.subValue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Risk Signals */}
              {data.riskSignals.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="size-4 text-orange-500" />
                      Risk Signals ({data.riskSignals.length})
                    </h4>
                    <div className="space-y-2">
                      {data.riskSignals.map((signal) => (
                        <div
                          key={signal.id}
                          className="flex items-start gap-3 rounded-lg border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-900/10 p-3 text-sm"
                        >
                          <AlertTriangle className="size-4 text-orange-500 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="secondary"
                                className={getSeverityBadge(signal.severity).className}
                              >
                                {getSeverityBadge(signal.severity).label}
                              </Badge>
                              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                                {signal.signalType}
                              </Badge>
                              {signal.isResolved && (
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                  Resolved
                                </Badge>
                              )}
                            </div>
                            <p>{signal.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Detected {formatDate(signal.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export function ContractsView() {
  // Filter state
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [category, setCategory] = useState<string>("all")
  const [awardMethod, setAwardMethod] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const [page, setPage] = useState(1)

  // Detail dialog state
  const [selectedContract, setSelectedContract] = useState<ContractListItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to page 1 on new search
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page when filters change
  const handleCategoryChange = useCallback((value: string) => {
    setCategory(value)
    setPage(1)
  }, [])

  const handleAwardMethodChange = useCallback((value: string) => {
    setAwardMethod(value)
    setPage(1)
  }, [])

  const handleStatusChange = useCallback((value: string) => {
    setStatus(value)
    setPage(1)
  }, [])

  // Build query params
  const queryParams = new URLSearchParams()
  if (debouncedSearch) queryParams.set("search", debouncedSearch)
  if (category !== "all") queryParams.set("category", category)
  if (awardMethod !== "all") queryParams.set("awardMethod", awardMethod)
  if (status !== "all") queryParams.set("status", status)
  queryParams.set("page", page.toString())
  queryParams.set("limit", "20")

  // Fetch contracts
  const { data, isLoading, error } = useQuery<ContractsResponse>({
    queryKey: ["contracts", debouncedSearch, category, awardMethod, status, page],
    queryFn: async () => {
      const res = await fetch(`/api/contracts?${queryParams.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch contracts")
      return res.json()
    },
  })

  const hasFilters = !!(debouncedSearch || category !== "all" || awardMethod !== "all" || status !== "all")

  const clearFilters = useCallback(() => {
    setSearch("")
    setDebouncedSearch("")
    setCategory("all")
    setAwardMethod("all")
    setStatus("all")
    setPage(1)
  }, [])

  const openDetail = useCallback((contract: ContractListItem) => {
    setSelectedContract(contract)
    setDetailOpen(true)
  }, [])

  // Calculate total value for stats
  const totalValue = data?.contracts.reduce((sum, c) => sum + c.totalObligated, 0) ?? 0

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-5" />
          <p>Failed to load contracts. Please try again later.</p>
        </div>
      </Card>
    )
  }

  if (isLoading) return <ContractsTableSkeleton />

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, title, or description..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={awardMethod} onValueChange={handleAwardMethodChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Award Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              {AWARD_METHODS.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Row */}
      {data && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">
              {data.pagination.totalCount}
            </span>{" "}
            {data.pagination.totalCount === 1 ? "contract" : "contracts"} found
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span className="flex items-center gap-1">
            <DollarSign className="size-3.5" />
            Total value:{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(totalValue)}
            </span>
          </span>
          {hasFilters && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={clearFilters}
              >
                <X className="size-3" />
                Clear filters
              </Button>
            </>
          )}
        </div>
      )}

      {/* Contract Table or Empty State */}
      {!data || data.contracts.length === 0 ? (
        <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Contract ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden lg:table-cell">Agency</TableHead>
                  <TableHead className="hidden md:table-cell">Contractor</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="hidden xl:table-cell">Award Method</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell text-center">Mods</TableHead>
                  <TableHead className="text-center">Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.contracts.map((contract) => {
                  const awardBadge = getAwardMethodBadge(contract.awardMethod)
                  const statusBadge = getStatusBadge(contract.status)
                  const valuesDiffer = contract.totalObligated !== contract.initialValue

                  return (
                    <TableRow
                      key={contract.id}
                      className="cursor-pointer"
                      onClick={() => openDetail(contract)}
                    >
                      <TableCell className="font-mono text-xs">
                        {contract.contractId}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium line-clamp-1 max-w-[200px] lg:max-w-none">
                          {contract.title}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                        {contract.agencyName}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        <span className="line-clamp-1 max-w-[140px]">
                          {contract.primeContractorName}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant="secondary"
                          className={getCategoryBadgeClass(contract.category)}
                        >
                          {contract.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-semibold">
                            {formatShortCurrency(contract.totalObligated)}
                          </span>
                          {valuesDiffer && (
                            <span className="text-xs text-muted-foreground">
                              initial: {formatShortCurrency(contract.initialValue)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <Badge variant="secondary" className={awardBadge.className}>
                          {awardBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center text-muted-foreground">
                        {contract.modificationCount}
                      </TableCell>
                      <TableCell className="text-center">
                        {contract.riskSignalCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400">
                            <AlertTriangle className="size-4" />
                            <span className="text-xs font-semibold">
                              {contract.riskSignalCount}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages} &middot;{" "}
            {data.pagination.totalCount} total results
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="gap-1"
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              className="gap-1"
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Contract Detail Dialog */}
      <ContractDetailDialog
        contract={selectedContract}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
