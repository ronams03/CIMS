import { db } from '@/lib/db'

export async function GET() {
  try {
    // 1. Market share by category (top contractors in each)
    const marketShares = await db.marketShare.findMany({
      include: {
        contractor: {
          select: { id: true, name: true, industry: true },
        },
      },
      orderBy: [{ category: 'asc' }, { totalValue: 'desc' }],
    })

    const marketShareByCategory: Record<string, typeof marketShares> = {}
    for (const ms of marketShares) {
      if (!marketShareByCategory[ms.category]) {
        marketShareByCategory[ms.category] = []
      }
      marketShareByCategory[ms.category].push(ms as never)
    }

    // 2. Win rate rankings (from MarketShare, sorted by winRate desc)
    const winRateRankings = await db.marketShare.findMany({
      include: {
        contractor: {
          select: { id: true, name: true, industry: true },
        },
      },
      orderBy: { winRate: 'desc' },
      take: 20,
    })

    const formattedWinRateRankings = winRateRankings.map((ms) => ({
      contractorId: ms.contractor.id,
      contractorName: ms.contractor.name,
      industry: ms.contractor.industry,
      category: ms.category,
      winRate: ms.winRate,
      totalValue: ms.totalValue,
      contractCount: ms.contractCount,
      period: ms.period,
    }))

    // 3. Total contract value by contractor
    const contractValueByContractorRaw = await db.contract.groupBy({
      by: ['primeContractorId'],
      _sum: { totalObligated: true },
      _count: true,
      orderBy: { _sum: { totalObligated: 'desc' } },
    })

    const contractorIds = contractValueByContractorRaw.map(
      (r) => r.primeContractorId
    )
    const contractors = await db.contractor.findMany({
      where: { id: { in: contractorIds } },
      select: {
        id: true,
        name: true,
        industry: true,
        riskScore: true,
      },
    })
    const contractorMap = new Map(contractors.map((c) => [c.id, c]))

    const totalContractValueByContractor = contractValueByContractorRaw.map(
      (row) => {
        const contractor = contractorMap.get(row.primeContractorId)
        return {
          contractorId: row.primeContractorId,
          contractorName: contractor?.name ?? 'Unknown',
          industry: contractor?.industry ?? 'Unknown',
          riskScore: contractor?.riskScore ?? 0,
          totalValue: row._sum.totalObligated ?? 0,
          contractCount: row._count,
        }
      }
    )

    // 4. Category-level statistics
    const categoryStatsRaw = await db.contract.groupBy({
      by: ['category'],
      _count: true,
      _sum: { totalObligated: true },
      _avg: { totalObligated: true },
      orderBy: { _sum: { totalObligated: 'desc' } },
    })

    const categoryStatistics = categoryStatsRaw.map((row) => ({
      category: row.category,
      totalValue: row._sum.totalObligated ?? 0,
      contractCount: row._count,
      avgValue: row._avg.totalObligated ?? 0,
    }))

    return Response.json({
      marketShareByCategory,
      winRateRankings: formattedWinRateRankings,
      totalContractValueByContractor,
      categoryStatistics,
    })
  } catch (error) {
    console.error('Market API error:', error)
    return Response.json(
      { error: 'Failed to fetch market intelligence' },
      { status: 500 }
    )
  }
}
