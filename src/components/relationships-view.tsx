"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Network, Users, Shield, AlertTriangle, Building2, MapPin, Link2, X } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgencyNode {
  id: string
  entityId: string
  type: "agency"
  name: string
  code: string
  category: string
}

interface ContractorNode {
  id: string
  entityId: string
  type: "contractor"
  name: string
  registrationId: string
  industry: string
  riskScore: number
  city: string
  state: string
}

type GraphNode = AgencyNode | ContractorNode

interface GraphEdge {
  source: string
  target: string
  type: "agency-contractor" | "contractor-subcontractor"
  weight: number
  contractCount?: number
  linkCount?: number
}

interface ContractorRiskScore {
  contractorId: string
  contractorName: string
  riskScore: number
}

interface RelationshipsSummary {
  totalNodes: number
  agencyNodes: number
  contractorNodes: number
  totalEdges: number
  agencyContractorEdges: number
  contractorSubcontractorEdges: number
}

interface RelationshipsData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  contractorRiskScores: ContractorRiskScore[]
  summary: RelationshipsSummary
}

interface Position {
  x: number
  y: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const compactCurrency = new Intl.NumberFormat("en-US", {
  notation: "compact",
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 1,
})

function formatCompactCurrency(value: number) {
  return compactCurrency.format(value)
}

function getRiskColor(score: number): string {
  if (score <= 30) return "#10b981" // emerald-500
  if (score <= 50) return "#f59e0b" // amber-500
  if (score <= 70) return "#f97316" // orange-500
  return "#ef4444" // red-500
}

function getRiskLabel(score: number): string {
  if (score <= 30) return "Low"
  if (score <= 50) return "Medium"
  if (score <= 70) return "High"
  return "Critical"
}

function getRiskBadgeClasses(score: number): string {
  if (score <= 30) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
  if (score <= 50) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
  if (score <= 70) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
  return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
}

function getProgressColorClass(score: number): string {
  if (score <= 30) return "[&>div]:bg-emerald-500"
  if (score <= 50) return "[&>div]:bg-amber-500"
  if (score <= 70) return "[&>div]:bg-orange-500"
  return "[&>div]:bg-red-500"
}

// ─── Compute node positions (circular layout) ────────────────────────────────

function computePositions(
  nodes: GraphNode[],
  width: number,
  height: number
): Map<string, Position> {
  const positions = new Map<string, Position>()
  const cx = width / 2
  const cy = height / 2

  const agencies = nodes.filter((n) => n.type === "agency")
  const contractors = nodes.filter((n) => n.type === "contractor")

  const innerRadius = Math.min(width, height) * 0.2
  const outerRadius = Math.min(width, height) * 0.42

  // Agencies in inner circle
  agencies.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / agencies.length - Math.PI / 2
    positions.set(node.id, {
      x: cx + innerRadius * Math.cos(angle),
      y: cy + innerRadius * Math.sin(angle),
    })
  })

  // Contractors in outer circle
  contractors.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / contractors.length - Math.PI / 2
    positions.set(node.id, {
      x: cx + outerRadius * Math.cos(angle),
      y: cy + outerRadius * Math.sin(angle),
    })
  })

  return positions
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function RelationshipsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Network className="size-5 text-emerald-600" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Tooltip Component ───────────────────────────────────────────────────────

function NodeTooltip({
  node,
  edges,
  nodesMap,
  position,
}: {
  node: GraphNode
  edges: GraphEdge[]
  nodesMap: Map<string, GraphNode>
  position: { x: number; y: number }
}) {
  const connectedEdges = edges.filter(
    (e) => e.source === node.id || e.target === node.id
  )
  const totalWeight = connectedEdges.reduce((sum, e) => sum + e.weight, 0)

  return (
    <div
      className="pointer-events-none absolute z-50 rounded-lg border bg-popover px-3 py-2 text-sm shadow-xl"
      style={{
        left: position.x + 12,
        top: position.y - 8,
      }}
    >
      <div className="font-semibold">{node.name}</div>
      <div className="text-xs text-muted-foreground capitalize">{node.type}</div>
      {node.type === "agency" && (
        <div className="text-xs text-muted-foreground">
          Code: {node.code} · Category: {node.category}
        </div>
      )}
      {node.type === "contractor" && (
        <div className="text-xs text-muted-foreground">
          Risk: {node.riskScore}/100 · {node.industry}
        </div>
      )}
      <div className="mt-1 text-xs text-muted-foreground">
        {connectedEdges.length} connection{connectedEdges.length !== 1 ? "s" : ""} · {formatCompactCurrency(totalWeight)}
      </div>
    </div>
  )
}

// ─── Detail Panel ────────────────────────────────────────────────────────────

function DetailPanel({
  node,
  edges,
  nodesMap,
  onClose,
  onSelectNode,
}: {
  node: GraphNode
  edges: GraphEdge[]
  nodesMap: Map<string, GraphNode>
  onClose: () => void
  onSelectNode: (id: string) => void
}) {
  const connectedEdges = edges.filter(
    (e) => e.source === node.id || e.target === node.id
  )

  const connections = connectedEdges.map((edge) => {
    const otherId = edge.source === node.id ? edge.target : edge.source
    const otherNode = nodesMap.get(otherId)
    return { edge, otherNode, otherId }
  })

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {node.type === "agency" ? (
              <Building2 className="size-5 text-emerald-600" />
            ) : (
              <Users className="size-5 text-emerald-600" />
            )}
            <CardTitle className="text-base">{node.name}</CardTitle>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <CardDescription className="capitalize">{node.type}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {node.type === "agency" && (
          <>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Code</span>
                <div className="font-medium">{node.code}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Category</span>
                <div className="font-medium capitalize">{node.category}</div>
              </div>
            </div>
          </>
        )}
        {node.type === "contractor" && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Risk Score</span>
                <span className="font-semibold" style={{ color: getRiskColor(node.riskScore) }}>
                  {node.riskScore}/100
                </span>
              </div>
              <Progress
                value={node.riskScore}
                className={`h-2 ${getProgressColorClass(node.riskScore)}`}
              />
              <Badge className={getRiskBadgeClasses(node.riskScore)} variant="secondary">
                {getRiskLabel(node.riskScore)} Risk
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Industry</span>
                <div className="font-medium">{node.industry}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Registration</span>
                <div className="font-medium text-xs">{node.registrationId}</div>
              </div>
            </div>
            {(node.city || node.state) && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-3.5" />
                {[node.city, node.state].filter(Boolean).join(", ")}
              </div>
            )}
          </>
        )}

        {/* Connected Entities */}
        <div className="border-t pt-3">
          <div className="flex items-center gap-1.5 text-sm font-medium mb-2">
            <Link2 className="size-3.5 text-emerald-600" />
            Connected Entities ({connections.length})
          </div>
          <ScrollArea className="max-h-48">
            <div className="space-y-1.5">
              {connections.map(({ edge, otherNode, otherId }) => (
                <button
                  key={otherId + edge.type}
                  onClick={() => onSelectNode(otherId)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="size-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          otherNode?.type === "agency" ? "#10b981" : getRiskColor(otherNode?.type === "contractor" ? otherNode.riskScore : 0),
                      }}
                    />
                    <span className="truncate">{otherNode?.name ?? otherId}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {formatCompactCurrency(edge.weight)}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Network Graph ───────────────────────────────────────────────────────────

function NetworkGraph({
  data,
  selectedNode,
  hoveredNode,
  onSelectNode,
  onHoverNode,
  onLeaveNode,
}: {
  data: RelationshipsData
  selectedNode: string | null
  hoveredNode: string | null
  onSelectNode: (id: string) => void
  onHoverNode: (id: string) => void
  onLeaveNode: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 })

  // Responsive dimensions
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: Math.max(400, Math.min(550, rect.width * 0.55)) })
      }
    }
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      const observer = new ResizeObserver(updateSize)
      observer.observe(containerRef.current)
      updateSize()
      return () => observer.disconnect()
    }
  }, [])

  const positions = useMemo(
    () => computePositions(data.nodes, dimensions.width, dimensions.height),
    [data.nodes, dimensions.width, dimensions.height]
  )

  const nodesMap = useMemo(() => {
    const map = new Map<string, GraphNode>()
    data.nodes.forEach((n) => map.set(n.id, n))
    return map
  }, [data.nodes])

  // Normalize edge weight for line thickness
  const maxWeight = useMemo(
    () => Math.max(...data.edges.map((e) => e.weight), 1),
    [data.edges]
  )

  const isConnected = useCallback(
    (nodeId: string, targetId: string) => {
      if (nodeId === targetId) return true
      return data.edges.some(
        (e) =>
          (e.source === nodeId && e.target === targetId) ||
          (e.source === targetId && e.target === nodeId)
      )
    },
    [data.edges]
  )

  const activeNodeId = hoveredNode || selectedNode

  return (
    <div ref={containerRef} className="w-full relative">
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="rounded-lg border bg-background"
      >
        {/* Defs for arrow markers and gradients */}
        <defs>
          <marker
            id="arrow-agency"
            viewBox="0 0 10 6"
            refX="10"
            refY="3"
            markerWidth="8"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,3 L0,6 z" fill="#10b981" opacity="0.5" />
          </marker>
          <marker
            id="arrow-contractor"
            viewBox="0 0 10 6"
            refX="10"
            refY="3"
            markerWidth="8"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,3 L0,6 z" fill="#f59e0b" opacity="0.5" />
          </marker>
        </defs>

        {/* Edges */}
        {data.edges.map((edge, i) => {
          const sourcePos = positions.get(edge.source)
          const targetPos = positions.get(edge.target)
          if (!sourcePos || !targetPos) return null

          const thickness = 1 + (edge.weight / maxWeight) * 3
          const isAgencyEdge = edge.type === "agency-contractor"

          let opacity = 0.35
          if (activeNodeId) {
            opacity =
              edge.source === activeNodeId || edge.target === activeNodeId
                ? 0.8
                : 0.08
          }

          return (
            <line
              key={`edge-${i}`}
              x1={sourcePos.x}
              y1={sourcePos.y}
              x2={targetPos.x}
              y2={targetPos.y}
              stroke={isAgencyEdge ? "#10b981" : "#f59e0b"}
              strokeWidth={thickness}
              strokeDasharray={isAgencyEdge ? "none" : "6 3"}
              opacity={opacity}
              style={{ transition: "opacity 0.2s ease" }}
            />
          )
        })}

        {/* Nodes */}
        {data.nodes.map((node) => {
          const pos = positions.get(node.id)
          if (!pos) return null

          const isAgency = node.type === "agency"
          const nodeRadius = isAgency ? 18 : 14
          const fillColor = isAgency ? "#10b981" : getRiskColor(node.riskScore)

          let nodeOpacity = 1
          let strokeColor = "transparent"
          let strokeWidth = 0
          if (activeNodeId) {
            if (node.id === activeNodeId) {
              strokeColor = "#ffffff"
              strokeWidth = 3
              nodeOpacity = 1
            } else if (isConnected(activeNodeId, node.id)) {
              nodeOpacity = 0.9
              strokeColor = "rgba(255,255,255,0.3)"
              strokeWidth = 1.5
            } else {
              nodeOpacity = 0.15
            }
          }

          const isSelected = node.id === selectedNode

          return (
            <g
              key={node.id}
              style={{
                opacity: nodeOpacity,
                transition: "opacity 0.2s ease",
                cursor: "pointer",
              }}
              onClick={() => onSelectNode(node.id)}
              onMouseEnter={() => onHoverNode(node.id)}
              onMouseLeave={onLeaveNode}
            >
              {/* Outer ring for selected node */}
              {isSelected && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeRadius + 6}
                  fill="none"
                  stroke={fillColor}
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  opacity={0.6}
                >
                  <animate
                    attributeName="r"
                    values={`${nodeRadius + 4};${nodeRadius + 8};${nodeRadius + 4}`}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              {/* Node circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={nodeRadius}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                style={{ transition: "all 0.2s ease" }}
              />
              {/* Label */}
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={isAgency ? 9 : 7}
                fontWeight={600}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {node.name.length > 8
                  ? node.name.substring(0, 7) + "…"
                  : node.name}
              </text>
              {/* Type indicator below */}
              <text
                x={pos.x}
                y={pos.y + nodeRadius + 12}
                textAnchor="middle"
                fill="currentColor"
                fontSize={9}
                className="fill-muted-foreground"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {isAgency ? node.code : `R:${node.riskScore}`}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── Risk Legend ─────────────────────────────────────────────────────────────

function RiskLegend() {
  const items = [
    { label: "Low (0-30)", color: "#10b981", bgClass: "bg-emerald-500" },
    { label: "Medium (30-50)", color: "#f59e0b", bgClass: "bg-amber-500" },
    { label: "High (50-70)", color: "#f97316", bgClass: "bg-orange-500" },
    { label: "Critical (70-100)", color: "#ef4444", bgClass: "bg-red-500" },
  ]

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <span className="font-medium">Risk Score:</span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div
            className="size-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 ml-2">
        <div className="w-5 h-0 border-t-2 border-emerald-500" />
        <span>Agency-Contractor</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-0 border-t-2 border-dashed border-amber-500" />
        <span>Contractor-Sub</span>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function RelationshipsView() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [tooltipInfo, setTooltipInfo] = useState<{
    node: GraphNode
    x: number
    y: number
  } | null>(null)

  const { data, isLoading, error } = useQuery<RelationshipsData>({
    queryKey: ["relationships"],
    queryFn: async () => {
      const res = await fetch("/api/relationships")
      if (!res.ok) throw new Error("Failed to fetch relationships data")
      return res.json()
    },
  })

  const nodesMap = useMemo(() => {
    const map = new Map<string, GraphNode>()
    data?.nodes.forEach((n) => map.set(n.id, n))
    return map
  }, [data?.nodes])

  const handleHoverNode = useCallback(
    (id: string) => {
      setHoveredNode(id)
      const node = nodesMap.get(id)
      if (node) {
        setTooltipInfo({ node, x: 0, y: 0 })
      }
    },
    [nodesMap]
  )

  const handleLeaveNode = useCallback(() => {
    setHoveredNode(null)
    setTooltipInfo(null)
  }, [])

  const handleSelectNode = useCallback((id: string) => {
    setSelectedNode((prev) => (prev === id ? null : id))
  }, [])

  if (isLoading) return <RelationshipsSkeleton />

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-5" />
          <p>Failed to load relationship data. Please try again later.</p>
        </div>
      </Card>
    )
  }

  if (!data) return null

  const highRiskCount = data.contractorRiskScores.filter(
    (c) => c.riskScore > 60
  ).length

  const selectedNodeData = selectedNode ? nodesMap.get(selectedNode) : null

  // Enrich contractor risk data with connection count
  const contractorTableData = data.contractorRiskScores
    .map((crs) => {
      const node = data.nodes.find(
        (n) => n.id === `contractor-${crs.contractorId}`
      ) as ContractorNode | undefined
      const connectionCount = data.edges.filter(
        (e) =>
          e.source === `contractor-${crs.contractorId}` ||
          e.target === `contractor-${crs.contractorId}`
      ).length
      return {
        ...crs,
        industry: node?.industry ?? "",
        city: node?.city ?? "",
        state: node?.state ?? "",
        nodeId: node?.id ?? "",
        connectionCount,
      }
    })
    .sort((a, b) => b.riskScore - a.riskScore)

  return (
    <div className="space-y-6">
      {/* Summary Cards Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entities</CardTitle>
            <Users className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalNodes}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.agencyNodes} agencies · {data.summary.contractorNodes} contractors
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
            <Network className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalEdges}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.agencyContractorEdges} agency links · {data.summary.contractorSubcontractorEdges} sub-links
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High-Risk Contractors</CardTitle>
            <Shield className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highRiskCount}</div>
            <p className="text-xs text-muted-foreground">
              with risk score above 60
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Network Graph + Detail Panel */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden min-w-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Network className="size-5 text-emerald-600" />
              <CardTitle className="text-base">Relationship Mapping</CardTitle>
            </div>
            <CardDescription>
              Interactive network of agency-contractor relationships. Hover to highlight, click for details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative" id="graph-container">
              <NetworkGraph
                data={data}
                selectedNode={selectedNode}
                hoveredNode={hoveredNode}
                onSelectNode={handleSelectNode}
                onHoverNode={handleHoverNode}
                onLeaveNode={handleLeaveNode}
              />
              {/* Tooltip */}
              {hoveredNode && tooltipInfo && (
                <NodeTooltip
                  node={tooltipInfo.node}
                  edges={data.edges}
                  nodesMap={nodesMap}
                  position={tooltipInfo}
                />
              )}
            </div>
            <RiskLegend />
          </CardContent>
        </Card>

        {/* Detail Panel */}
        {selectedNodeData && (
          <DetailPanel
            node={selectedNodeData}
            edges={data.edges}
            nodesMap={nodesMap}
            onClose={() => setSelectedNode(null)}
            onSelectNode={handleSelectNode}
          />
        )}
        {!selectedNodeData && (
          <Card className="flex items-center justify-center h-64 lg:h-auto min-w-0">
            <div className="text-center text-muted-foreground space-y-2 p-6">
              <Network className="size-10 mx-auto opacity-30" />
              <p className="text-sm">Click a node in the graph to view details</p>
            </div>
          </Card>
        )}
      </div>

      {/* Contractor Risk Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-orange-500" />
            <CardTitle className="text-base">Contractor Risk Assessment</CardTitle>
          </div>
          <CardDescription>
            All contractors ranked by risk score. Click a row to select in the graph.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="max-w-[180px]">Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Industry</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead className="text-right">Connections</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractorTableData.map((contractor) => (
                  <TableRow
                    key={contractor.contractorId}
                    className="cursor-pointer"
                    data-state={
                      selectedNode === contractor.nodeId ? "selected" : undefined
                    }
                    onClick={() => handleSelectNode(contractor.nodeId)}
                  >
                    <TableCell className="font-medium max-w-[180px] truncate">
                      {contractor.contractorName}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {contractor.industry}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={getRiskBadgeClasses(contractor.riskScore)}
                          variant="secondary"
                        >
                          {contractor.riskScore}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {getRiskLabel(contractor.riskScore)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {[contractor.city, contractor.state]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {contractor.connectionCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
