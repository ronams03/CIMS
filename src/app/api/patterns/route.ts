import { db } from '@/lib/db'

export async function GET() {
  try {
    // 1. Persistent winners: contractors with highest win rates, grouped by category
    const marketShares = await db.marketShare.findMany({
      include: {
        contractor: {
          select: { id: true, name: true },
        },
      },
      orderBy: { winRate: 'desc' },
    })

    const persistentWinnersMap = new Map<string, { contractor: { id: string; name: string }; winRate: number; totalValue: number; contractCount: number }[]>()
    for (const ms of marketShares) {
      const list = persistentWinnersMap.get(ms.category) ?? []
      list.push({
        contractor: { id: ms.contractor.id, name: ms.contractor.name },
        winRate: ms.winRate,
        totalValue: ms.totalValue,
        contractCount: ms.contractCount,
      })
      persistentWinnersMap.set(ms.category, list)
    }
    const persistentWinners: Record<string, typeof marketShares> = {}
    for (const [category, entries] of persistentWinnersMap) {
      persistentWinners[category] = entries as never
    }

    // 2. Timing analysis: contracts awarded in Q4 or December
    const allContracts = await db.contract.findMany({
      select: {
        id: true,
        contractId: true,
        title: true,
        awardDate: true,
        initialValue: true,
        totalObligated: true,
        awardMethod: true,
        agency: { select: { name: true } },
        primeContractor: { select: { name: true } },
      },
    })

    const q4Contracts = allContracts.filter((c) => {
      const month = new Date(c.awardDate).getMonth() + 1
      return month >= 10
    })

    const decemberContracts = allContracts.filter((c) => {
      const month = new Date(c.awardDate).getMonth() + 1
      return month === 12
    })

    const totalContractCount = allContracts.length
    const q4Percentage = totalContractCount > 0
      ? (q4Contracts.length / totalContractCount) * 100
      : 0
    const decemberPercentage = totalContractCount > 0
      ? (decemberContracts.length / totalContractCount) * 100
      : 0

    // Quarterly distribution
    const quarterlyDistribution: Record<string, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 }
    for (const c of allContracts) {
      const month = new Date(c.awardDate).getMonth() + 1
      if (month <= 3) quarterlyDistribution.Q1++
      else if (month <= 6) quarterlyDistribution.Q2++
      else if (month <= 9) quarterlyDistribution.Q3++
      else quarterlyDistribution.Q4++
    }

    // 3. Scope creep: contracts where totalObligated > initialValue * 1.3
    const scopeCreepContracts = allContracts.filter(
      (c) => c.initialValue > 0 && c.totalObligated > c.initialValue * 1.3
    )

    // Get modification details for scope creep contracts
    const scopeCreepIds = scopeCreepContracts.map((c) => c.id)
    const scopeCreepModifications = await db.contractModification.findMany({
      where: { contractId: { in: scopeCreepIds } },
      orderBy: { modNumber: 'asc' },
    })

    const scopeCreep = scopeCreepContracts.map((c) => ({
      ...c,
      growthPercentage: ((c.totalObligated - c.initialValue) / c.initialValue) * 100,
      modifications: scopeCreepModifications.filter((m) => m.contractId === c.id),
    }))

    // 4. Award method distribution over time
    const awardMethodByQuarterRaw = new Map<string, Map<string, number>>()

    for (const c of allContracts) {
      const date = new Date(c.awardDate)
      const quarter = Math.floor(date.getMonth() / 3) + 1
      const year = date.getFullYear()
      const key = `Q${quarter}-${year}`

      if (!awardMethodByQuarterRaw.has(key)) {
        awardMethodByQuarterRaw.set(key, new Map())
      }
      const quarterMap = awardMethodByQuarterRaw.get(key)!
      quarterMap.set(c.awardMethod, (quarterMap.get(c.awardMethod) ?? 0) + 1)
    }

    const awardMethodOverTime: Record<string, Record<string, number>> = {}
    for (const [quarter, methodMap] of awardMethodByQuarterRaw) {
      awardMethodOverTime[quarter] = Object.fromEntries(methodMap)
    }

    // Also overall distribution
    const awardMethodOverallRaw = await db.contract.groupBy({
      by: ['awardMethod'],
      _count: true,
    })
    const awardMethodOverall = awardMethodOverallRaw.map((r) => ({
      awardMethod: r.awardMethod,
      count: r._count,
    }))

    // 5. Sole-source contracts percentage
    const soleSourceCount = allContracts.filter(
      (c) => c.awardMethod.toLowerCase().includes('sole')
    ).length
    const soleSourcePercentage = totalContractCount > 0
      ? (soleSourceCount / totalContractCount) * 100
      : 0

    return Response.json({
      persistentWinners,
      timingAnalysis: {
        q4Contracts: q4Contracts.length,
        decemberContracts: decemberContracts.length,
        q4Percentage: Math.round(q4Percentage * 100) / 100,
        decemberPercentage: Math.round(decemberPercentage * 100) / 100,
        quarterlyDistribution,
        endOfYearSpike: q4Percentage > 35,
        recentQ4Contracts: q4Contracts.slice(0, 10),
      },
      scopeCreep: {
        count: scopeCreep.length,
        contracts: scopeCreep,
      },
      awardMethodDistribution: {
        overTime: awardMethodOverTime,
        overall: awardMethodOverall,
      },
      soleSource: {
        count: soleSourceCount,
        percentage: Math.round(soleSourcePercentage * 100) / 100,
        totalContracts: totalContractCount,
      },
    })
  } catch (error) {
    console.error('Patterns API error:', error)
    return Response.json(
      { error: 'Failed to fetch pattern analysis' },
      { status: 500 }
    )
  }
}
