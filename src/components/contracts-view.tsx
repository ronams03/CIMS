"use client"

import { useState, useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FileText,
  DollarSign,
  X,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

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

interface AgencyOption {
  id: string
  name: string
  code: string
}

interface ContractorOption {
  id: string
  name: string
  registrationId: string
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

const MODIFICATION_REASONS = [
  { value: "scope change", label: "Scope Change" },
  { value: "extension", label: "Extension" },
  { value: "funding adjustment", label: "Funding Adjustment" },
  { value: "other", label: "Other" },
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

function toDateInputValue(dateStr: string | null): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  return date.toISOString().split("T")[0]
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
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] min-w-0">ID</TableHead>
                  <TableHead className="min-w-0">Title</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-0">Agency</TableHead>
                  <TableHead className="hidden md:table-cell min-w-0">Contractor</TableHead>
                  <TableHead className="hidden sm:table-cell min-w-0">Category</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="hidden xl:table-cell">Award Method</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell text-center w-[50px]">Mods</TableHead>
                  <TableHead className="text-center w-[50px]">Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-14" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell className="hidden xl:table-cell"><Skeleton className="h-5 w-18" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-14" /></TableCell>
                    <TableCell className="hidden lg:table-cell text-center"><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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

// ── Create Contract Dialog ─────────────────────────────────────────────────

interface CreateContractForm {
  contractId: string
  title: string
  description: string
  agencyId: string
  primeContractorId: string
  category: string
  initialValue: string
  totalObligated: string
  awardMethod: string
  status: string
  awardDate: string
  endDate: string
}

const emptyCreateForm: CreateContractForm = {
  contractId: "",
  title: "",
  description: "",
  agencyId: "",
  primeContractorId: "",
  category: "",
  initialValue: "",
  totalObligated: "",
  awardMethod: "",
  status: "active",
  awardDate: "",
  endDate: "",
}

function CreateContractDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CreateContractForm>(emptyCreateForm)

  // Fetch agencies and contractors for the form selects
  const { data: agenciesData } = useQuery<{ agencies: AgencyOption[] }>({
    queryKey: ["agencies"],
    queryFn: async () => {
      const res = await fetch("/api/agencies")
      if (!res.ok) throw new Error("Failed to fetch agencies")
      return res.json()
    },
    enabled: open,
  })

  const { data: contractorsData } = useQuery<{ contractors: ContractorOption[] }>({
    queryKey: ["contractors"],
    queryFn: async () => {
      const res = await fetch("/api/contractors")
      if (!res.ok) throw new Error("Failed to fetch contractors")
      return res.json()
    },
    enabled: open,
  })

  const createMutation = useMutation({
    mutationFn: async (data: CreateContractForm) => {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: data.contractId,
          title: data.title,
          description: data.description,
          agencyId: data.agencyId,
          primeContractorId: data.primeContractorId,
          category: data.category,
          initialValue: parseFloat(data.initialValue),
          totalObligated: parseFloat(data.totalObligated),
          awardMethod: data.awardMethod,
          status: data.status,
          awardDate: data.awardDate,
          endDate: data.endDate || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create contract")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] })
      toast({
        title: "Contract created",
        description: "The new contract has been successfully created.",
      })
      setForm(emptyCreateForm)
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const updateField = useCallback((field: keyof CreateContractForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(form)
  }, [createMutation, form])

  const agencies = agenciesData?.agencies ?? []
  const contractors = contractorsData?.contractors ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Contract</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new contract record.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-contractId">Contract ID *</Label>
            <Input
              id="create-contractId"
              placeholder="e.g. CTR-2024-001"
              value={form.contractId}
              onChange={(e) => updateField("contractId", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-title">Title *</Label>
            <Input
              id="create-title"
              placeholder="Contract title"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-description">Description</Label>
            <Textarea
              id="create-description"
              placeholder="Optional description..."
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-agency">Agency *</Label>
              <Select value={form.agencyId} onValueChange={(v) => updateField("agencyId", v)}>
                <SelectTrigger id="create-agency">
                  <SelectValue placeholder="Select agency" />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-contractor">Prime Contractor *</Label>
              <Select value={form.primeContractorId} onValueChange={(v) => updateField("primeContractorId", v)}>
                <SelectTrigger id="create-contractor">
                  <SelectValue placeholder="Select contractor" />
                </SelectTrigger>
                <SelectContent>
                  {contractors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-category">Category *</Label>
              <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
                <SelectTrigger id="create-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-awardMethod">Award Method *</Label>
              <Select value={form.awardMethod} onValueChange={(v) => updateField("awardMethod", v)}>
                <SelectTrigger id="create-awardMethod">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {AWARD_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-initialValue">Initial Value *</Label>
              <Input
                id="create-initialValue"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.initialValue}
                onChange={(e) => updateField("initialValue", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-totalObligated">Total Obligated *</Label>
              <Input
                id="create-totalObligated"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.totalObligated}
                onChange={(e) => updateField("totalObligated", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-status">Status</Label>
              <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
                <SelectTrigger id="create-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-awardDate">Award Date *</Label>
              <Input
                id="create-awardDate"
                type="date"
                value={form.awardDate}
                onChange={(e) => updateField("awardDate", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-endDate">End Date</Label>
              <Input
                id="create-endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="gap-2"
            >
              {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Create Contract
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Add Modification Dialog ────────────────────────────────────────────────

interface ModificationForm {
  description: string
  valueChange: string
  reason: string
}

function AddModificationDialog({
  open,
  onOpenChange,
  contractId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractId: string
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ModificationForm>({
    description: "",
    valueChange: "",
    reason: "",
  })

  const addModMutation = useMutation({
    mutationFn: async (data: ModificationForm) => {
      const res = await fetch(`/api/contracts/${contractId}/modifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: data.description,
          valueChange: parseFloat(data.valueChange),
          reason: data.reason,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to add modification")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] })
      queryClient.invalidateQueries({ queryKey: ["contract-detail", contractId] })
      toast({
        title: "Modification added",
        description: "The modification has been successfully added.",
      })
      setForm({ description: "", valueChange: "", reason: "" })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    addModMutation.mutate(form)
  }, [addModMutation, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Modification</DialogTitle>
          <DialogDescription>
            Add a new modification to this contract.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mod-description">Description *</Label>
            <Input
              id="mod-description"
              placeholder="Modification description"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mod-valueChange">Value Change *</Label>
            <Input
              id="mod-valueChange"
              type="number"
              step="0.01"
              placeholder="Positive or negative value"
              value={form.valueChange}
              onChange={(e) => setForm(prev => ({ ...prev, valueChange: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mod-reason">Reason *</Label>
            <Select value={form.reason} onValueChange={(v) => setForm(prev => ({ ...prev, reason: v }))}>
              <SelectTrigger id="mod-reason">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {MODIFICATION_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addModMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addModMutation.isPending}
              className="gap-2"
            >
              {addModMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Add Modification
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Contract Detail Dialog (with Edit/Delete) ──────────────────────────────

function ContractDetailDialog({
  contract,
  open,
  onOpenChange,
}: {
  contract: ContractListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [addModOpen, setAddModOpen] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState<{
    title: string
    description: string
    category: string
    awardMethod: string
    status: string
    initialValue: string
    totalObligated: string
    awardDate: string
    endDate: string
    agencyId: string
    primeContractorId: string
  }>({
    title: "",
    description: "",
    category: "",
    awardMethod: "",
    status: "",
    initialValue: "",
    totalObligated: "",
    awardDate: "",
    endDate: "",
    agencyId: "",
    primeContractorId: "",
  })

  const { data, isLoading } = useQuery<{ contract: ContractDetail }>({
    queryKey: ["contract-detail", contract?.id],
    queryFn: async () => {
      const res = await fetch(`/api/contracts/${contract!.id}`)
      if (!res.ok) throw new Error("Failed to fetch contract details")
      return res.json()
    },
    enabled: open && !!contract?.id,
  })

  // Fetch agencies and contractors for edit form
  const { data: agenciesData } = useQuery<{ agencies: AgencyOption[] }>({
    queryKey: ["agencies"],
    queryFn: async () => {
      const res = await fetch("/api/agencies")
      if (!res.ok) throw new Error("Failed to fetch agencies")
      return res.json()
    },
    enabled: isEditing,
  })

  const { data: contractorsData } = useQuery<{ contractors: ContractorOption[] }>({
    queryKey: ["contractors"],
    queryFn: async () => {
      const res = await fetch("/api/contractors")
      if (!res.ok) throw new Error("Failed to fetch contractors")
      return res.json()
    },
    enabled: isEditing,
  })

  const detail = data?.contract

  // Populate edit form when entering edit mode
  const enterEditMode = useCallback(() => {
    if (detail) {
      setEditForm({
        title: detail.title,
        description: detail.description,
        category: detail.category,
        awardMethod: detail.awardMethod,
        status: detail.status,
        initialValue: detail.initialValue.toString(),
        totalObligated: detail.totalObligated.toString(),
        awardDate: toDateInputValue(detail.awardDate),
        endDate: toDateInputValue(detail.endDate),
        agencyId: detail.agency.id,
        primeContractorId: detail.primeContractor.id,
      })
    }
    setIsEditing(true)
  }, [detail])

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/contracts/${contract!.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete contract")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] })
      queryClient.invalidateQueries({ queryKey: ["contract-detail", contract?.id] })
      toast({
        title: "Contract deleted",
        description: "The contract has been successfully deleted.",
      })
      setDeleteConfirmOpen(false)
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      setDeleteConfirmOpen(false)
    },
  })

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/contracts/${contract!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
          awardMethod: editForm.awardMethod,
          status: editForm.status,
          initialValue: parseFloat(editForm.initialValue),
          totalObligated: parseFloat(editForm.totalObligated),
          awardDate: editForm.awardDate,
          endDate: editForm.endDate || null,
          agencyId: editForm.agencyId,
          primeContractorId: editForm.primeContractorId,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update contract")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] })
      queryClient.invalidateQueries({ queryKey: ["contract-detail", contract?.id] })
      toast({
        title: "Contract updated",
        description: "The contract has been successfully updated.",
      })
      setIsEditing(false)
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Resolve risk signal mutation
  const resolveMutation = useMutation({
    mutationFn: async (signalId: string) => {
      const res = await fetch(`/api/contracts/${contract!.id}/resolve-signal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signalId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to resolve signal")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] })
      queryClient.invalidateQueries({ queryKey: ["contract-detail", contract?.id] })
      toast({
        title: "Risk signal resolved",
        description: "The risk signal has been marked as resolved.",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const updateEditField = useCallback((field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }, [])

  // Wrapper for onOpenChange that resets state on close
  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      setIsEditing(false)
      setDeleteConfirmOpen(false)
      setAddModOpen(false)
    }
    onOpenChange(nextOpen)
  }, [onOpenChange])

  const agencies = agenciesData?.agencies ?? []
  const contractors = contractorsData?.contractors ?? []

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {isLoading || !detail ? (
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
          ) : isEditing ? (
            /* ── Edit Mode ── */
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm text-emerald-600">
                    {detail.contractId}
                  </span>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-base">Edit Contract</span>
                </DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  editMutation.mutate()
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    value={editForm.title}
                    onChange={(e) => updateEditField("title", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => updateEditField("description", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-agency">Agency</Label>
                    <Select value={editForm.agencyId} onValueChange={(v) => updateEditField("agencyId", v)}>
                      <SelectTrigger id="edit-agency">
                        <SelectValue placeholder="Select agency" />
                      </SelectTrigger>
                      <SelectContent>
                        {agencies.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name} ({a.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-contractor">Prime Contractor</Label>
                    <Select value={editForm.primeContractorId} onValueChange={(v) => updateEditField("primeContractorId", v)}>
                      <SelectTrigger id="edit-contractor">
                        <SelectValue placeholder="Select contractor" />
                      </SelectTrigger>
                      <SelectContent>
                        {contractors.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select value={editForm.category} onValueChange={(v) => updateEditField("category", v)}>
                      <SelectTrigger id="edit-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-awardMethod">Award Method</Label>
                    <Select value={editForm.awardMethod} onValueChange={(v) => updateEditField("awardMethod", v)}>
                      <SelectTrigger id="edit-awardMethod">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AWARD_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-initialValue">Initial Value</Label>
                    <Input
                      id="edit-initialValue"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.initialValue}
                      onChange={(e) => updateEditField("initialValue", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-totalObligated">Total Obligated</Label>
                    <Input
                      id="edit-totalObligated"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.totalObligated}
                      onChange={(e) => updateEditField("totalObligated", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select value={editForm.status} onValueChange={(v) => updateEditField("status", v)}>
                      <SelectTrigger id="edit-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-awardDate">Award Date</Label>
                    <Input
                      id="edit-awardDate"
                      type="date"
                      value={editForm.awardDate}
                      onChange={(e) => updateEditField("awardDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-endDate">End Date</Label>
                    <Input
                      id="edit-endDate"
                      type="date"
                      value={editForm.endDate}
                      onChange={(e) => updateEditField("endDate", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={editMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={editMutation.isPending}
                    className="gap-2"
                  >
                    {editMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </>
          ) : (
            /* ── View Mode ── */
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm text-emerald-600">
                        {detail.contractId}
                      </span>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="text-base">{detail.title}</span>
                    </DialogTitle>
                    <DialogDescription className="mt-1.5">{detail.description}</DialogDescription>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => enterEditMode()}
                      title="Edit contract"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirmOpen(true)}
                      title="Delete contract"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5">
                {/* Key details grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Agency</span>
                    <p className="font-medium truncate max-w-[200px]" title={detail.agency.name}>{detail.agency.name} ({detail.agency.code})</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prime Contractor</span>
                    <p className="font-medium truncate max-w-[200px]" title={detail.primeContractor.name}>{detail.primeContractor.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category</span>
                    <p>
                      <Badge variant="secondary" className={getCategoryBadgeClass(detail.category)}>
                        {detail.category}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Award Method</span>
                    <p>
                      <Badge
                        variant="secondary"
                        className={getAwardMethodBadge(detail.awardMethod).className}
                      >
                        {getAwardMethodBadge(detail.awardMethod).label}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <p>
                      <Badge
                        variant="secondary"
                        className={getStatusBadge(detail.status).className}
                      >
                        {getStatusBadge(detail.status).label}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Award Date</span>
                    <p className="font-medium">{formatDate(detail.awardDate)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">End Date</span>
                    <p className="font-medium">{formatDate(detail.endDate)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bid Date</span>
                    <p className="font-medium">{formatDate(detail.bidDate)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Initial Value</span>
                    <p className="font-medium">{formatCurrency(detail.initialValue)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Obligated</span>
                    <p className="font-semibold text-emerald-600">
                      {formatCurrency(detail.totalObligated)}
                    </p>
                  </div>
                </div>

                {/* Value change indicator */}
                {detail.totalObligated !== detail.initialValue && (
                  <div className="rounded-lg border p-3 text-sm">
                    <span className="text-muted-foreground">Value change from initial: </span>
                    <span
                      className={
                        detail.totalObligated > detail.initialValue
                          ? "text-emerald-600 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {detail.totalObligated > detail.initialValue ? "+" : ""}
                      {formatCurrency(detail.totalObligated - detail.initialValue)}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      ({((detail.totalObligated - detail.initialValue) / detail.initialValue * 100).toFixed(1)}%)
                    </span>
                  </div>
                )}

                {/* Modifications */}
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="size-4 text-emerald-600" />
                      Modifications ({detail.modifications.length})
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setAddModOpen(true)}
                    >
                      <Plus className="size-3.5" />
                      Add Modification
                    </Button>
                  </div>
                  {detail.modifications.length > 0 ? (
                    <div className="space-y-2">
                      {detail.modifications.map((mod) => (
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
                  ) : (
                    <p className="text-sm text-muted-foreground">No modifications yet.</p>
                  )}
                </div>

                {/* Subcontractors */}
                {detail.subcontractors.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <DollarSign className="size-4 text-emerald-600" />
                        Subcontractors ({detail.subcontractors.length})
                      </h4>
                      <div className="space-y-2">
                        {detail.subcontractors.map((sub) => (
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
                {(detail.riskSignals.length > 0) && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="size-4 text-orange-500" />
                        Risk Signals ({detail.riskSignals.length})
                      </h4>
                      <div className="space-y-2">
                        {detail.riskSignals.map((signal) => (
                          <div
                            key={signal.id}
                            className="flex items-start gap-3 rounded-lg border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-900/10 p-3 text-sm"
                          >
                            <AlertTriangle className="size-4 text-orange-500 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                            {!signal.isResolved && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="shrink-0 text-xs h-7"
                                onClick={() => resolveMutation.mutate(signal.id)}
                                disabled={resolveMutation.isPending}
                              >
                                {resolveMutation.isPending ? (
                                  <Loader2 className="size-3 animate-spin mr-1" />
                                ) : null}
                                Resolve
                              </Button>
                            )}
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

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contract</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete contract <strong>{detail?.contractId}</strong>? This action cannot be undone and will also remove all associated modifications, subcontractor links, and risk signals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {deleteMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Modification Dialog */}
      {contract && (
        <AddModificationDialog
          open={addModOpen}
          onOpenChange={setAddModOpen}
          contractId={contract.id}
        />
      )}
    </>
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

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false)

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

          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New Contract
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      {data && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
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
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] min-w-0">ID</TableHead>
                    <TableHead className="min-w-0">Title</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-0">Agency</TableHead>
                    <TableHead className="hidden md:table-cell min-w-0">Contractor</TableHead>
                    <TableHead className="hidden sm:table-cell min-w-0">Category</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Value</TableHead>
                    <TableHead className="hidden xl:table-cell">Award Method</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden lg:table-cell text-center w-[50px]">Mods</TableHead>
                    <TableHead className="text-center w-[50px]">Risk</TableHead>
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
                        <TableCell className="font-mono text-xs max-w-[100px] truncate" title={contract.contractId}>
                          {contract.contractId}
                        </TableCell>
                        <TableCell className="min-w-0">
                          <span className="font-medium max-w-[180px] truncate block" title={contract.title}>
                            {contract.title}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm min-w-0">
                          <span className="max-w-[150px] truncate block" title={contract.agencyName}>
                            {contract.agencyName}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm min-w-0">
                          <span className="max-w-[150px] truncate block" title={contract.primeContractorName}>
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
                        <TableCell className="text-right whitespace-nowrap">
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
            </div>
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

      {/* Create Contract Dialog */}
      <CreateContractDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  )
}
