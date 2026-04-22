import { db } from '@/lib/db'

export async function GET() {
  try {
    // KPIs
    const [totalContracts, valueAgg, activeRiskSignals] = await Promise.all([
      db.contract.count(),
      db.contract.aggregate({
        _sum: { totalObligated: true },
        _avg: { totalObligated: true },
      }),
      db.riskSignal.count({ where: { isResolved: false } }),
    ])

    const kpis = {
      totalContracts,
      totalValue: valueAgg._sum.totalObligated ?? 0,
      avgContractValue: Math.round(valueAgg._avg.totalObligated ?? 0),
      activeRiskSignals,
    }

    // Contracts by category
    const categoryRaw = await db.contract.groupBy({
      by: ['category'],
      _sum: { totalObligated: true },
      _count: true,
      orderBy: { _sum: { totalObligated: 'desc' } },
    })
    const contractsByCategory = categoryRaw.map((r) => ({
      category: r.category.charAt(0).toUpperCase() + r.category.slice(1),
      value: r._sum.totalObligated ?? 0,
    }))

    // Contracts by status
    const statusRaw = await db.contract.groupBy({
      by: ['status'],
      _count: true,
    })
    const statusColors: Record<string, string> = {
      active: "hsl(160, 60%, 45%)",
      completed: "hsl(140, 50%, 50%)",
      terminated: "hsl(0, 70%, 55%)",
      modified: "hsl(45, 80%, 50%)",
    }
    const contractsByStatus = statusRaw.map((r) => ({
      status: r.status.charAt(0).toUpperCase() + r.status.slice(1),
      count: r._count,
      fill: statusColors[r.status] ?? "hsl(200, 50%, 50%)",
    }))

    // Award method distribution
    const awardMethodRaw = await db.contract.groupBy({
      by: ['awardMethod'],
      _count: true,
    })
    const methodColors: Record<string, string> = {
      competitive: "hsl(160, 60%, 45%)",
      'sole-source': "hsl(35, 80%, 50%)",
      emergency: "hsl(0, 70%, 55%)",
    }
    const awardMethodDistribution = awardMethodRaw.map((r) => ({
      method: r.awardMethod.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-'),
      count: r._count,
      fill: methodColors[r.awardMethod] ?? "hsl(200, 50%, 50%)",
    }))

    // Top 5 contractors by value
    const topContractorsRaw = await db.contract.groupBy({
      by: ['primeContractorId'],
      _sum: { totalObligated: true },
      _count: true,
      orderBy: { _sum: { totalObligated: 'desc' } },
      take: 5,
    })
    const contractorIds = topContractorsRaw.map((r) => r.primeContractorId)
    const contractors = await db.contractor.findMany({
      where: { id: { in: contractorIds } },
      select: { id: true, name: true },
    })
    const contractorMap = new Map(contractors.map((c) => [c.id, c.name]))
    const topContractors = topContractorsRaw.map((r) => ({
      name: contractorMap.get(r.primeContractorId) ?? 'Unknown',
      value: r._sum.totalObligated ?? 0,
      contracts: r._count,
    }))

    // Recent contracts
    const recentContractsRaw = await db.contract.findMany({
      take: 5,
      orderBy: { awardDate: 'desc' },
      select: {
        contractId: true,
        title: true,
        totalObligated: true,
        status: true,
        awardDate: true,
        category: true,
        agency: { select: { name: true } },
        primeContractor: { select: { name: true } },
      },
    })
    const recentContracts = recentContractsRaw.map((c) => ({
      id: c.contractId,
      title: c.title,
      contractor: c.primeContractor.name,
      value: c.totalObligated,
      status: c.status.charAt(0).toUpperCase() + c.status.slice(1),
      date: c.awardDate.toISOString().split('T')[0],
      category: c.category.charAt(0).toUpperCase() + c.category.slice(1),
    }))

    // Risk signal summary
    const riskBySeverityRaw = await db.riskSignal.groupBy({
      by: ['severity'],
      _count: true,
    })
    const riskByTypeRaw = await db.riskSignal.groupBy({
      by: ['signalType'],
      _count: true,
    })

    // Combine severity and type into a flat list for the dashboard
    const severityLabels: Record<string, string> = {
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    }
    const typeLabels: Record<string, string> = {
      'sole-source': 'Sole-Source Award',
      'scope-creep': 'Scope Creep',
      'timing-irregularity': 'Timing Irregularity',
      concentration: 'Concentration Risk',
    }

    const riskSignals = riskBySeverityRaw.map((r) => ({
      severity: severityLabels[r.severity] ?? r.severity,
      count: r._count,
      type: typeLabels[riskByTypeRaw.find(t => t._count > 0)?.signalType ?? ''] ?? 'Various',
    }))

    // Also add risk by type as separate entries
    const riskByTypeEntries = riskByTypeRaw.map((r) => ({
      severity: severityLabels[riskBySeverityRaw.find(s => s._count > 0)?.severity ?? ''] ?? 'Various',
      count: r._count,
      type: typeLabels[r.signalType] ?? r.signalType,
    }))

    const allRiskSignals = [
      ...riskBySeverityRaw.map((r) => ({
        severity: severityLabels[r.severity] ?? r.severity,
        count: r._count,
        type: 'All Types',
      })),
      ...riskByTypeEntries,
    ]

    return Response.json({
      kpis,
      contractsByCategory,
      awardMethodDistribution,
      contractsByStatus,
      topContractors,
      recentContracts,
      riskSignals: allRiskSignals,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return Response.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
