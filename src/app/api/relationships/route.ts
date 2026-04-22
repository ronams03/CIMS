import { db } from '@/lib/db'

export async function GET() {
  try {
    // Fetch all agencies
    const agencies = await db.agency.findMany({
      select: { id: true, name: true, code: true, category: true },
    })

    // Fetch all contractors with risk scores
    const contractors = await db.contractor.findMany({
      select: {
        id: true,
        name: true,
        registrationId: true,
        industry: true,
        riskScore: true,
        city: true,
        state: true,
      },
    })

    // Build nodes
    const agencyNodes = agencies.map((a) => ({
      id: `agency-${a.id}`,
      entityId: a.id,
      type: 'agency' as const,
      name: a.name,
      code: a.code,
      category: a.category,
    }))

    const contractorNodes = contractors.map((c) => ({
      id: `contractor-${c.id}`,
      entityId: c.id,
      type: 'contractor' as const,
      name: c.name,
      registrationId: c.registrationId,
      industry: c.industry,
      riskScore: c.riskScore,
      city: c.city,
      state: c.state,
    }))

    // Build edges: agency-contractor relationships (from contracts)
    const contracts = await db.contract.findMany({
      select: {
        agencyId: true,
        primeContractorId: true,
        totalObligated: true,
      },
    })

    const agencyContractorMap = new Map<string, { totalValue: number; contractCount: number }>()
    for (const contract of contracts) {
      const key = `${contract.agencyId}|${contract.primeContractorId}`
      const existing = agencyContractorMap.get(key)
      if (existing) {
        existing.totalValue += contract.totalObligated
        existing.contractCount += 1
      } else {
        agencyContractorMap.set(key, {
          totalValue: contract.totalObligated,
          contractCount: 1,
        })
      }
    }

    const agencyContractorEdges = Array.from(agencyContractorMap.entries()).map(
      ([key, value]) => {
        const [agencyId, contractorId] = key.split('|')
        return {
          source: `agency-${agencyId}`,
          target: `contractor-${contractorId}`,
          type: 'agency-contractor' as const,
          weight: value.totalValue,
          contractCount: value.contractCount,
        }
      }
    )

    // Build edges: contractor-subcontractor relationships
    const subcontractorLinks = await db.subcontractorLink.findMany({
      select: {
        contractorId: true,
        contract: {
          select: { primeContractorId: true },
        },
        subValue: true,
        description: true,
      },
    })

    const contractorSubMap = new Map<string, { totalSubValue: number; linkCount: number }>()
    for (const link of subcontractorLinks) {
      const key = `${link.contract.primeContractorId}|${link.contractorId}`
      const existing = contractorSubMap.get(key)
      if (existing) {
        existing.totalSubValue += link.subValue
        existing.linkCount += 1
      } else {
        contractorSubMap.set(key, {
          totalSubValue: link.subValue,
          linkCount: 1,
        })
      }
    }

    const contractorSubcontractorEdges = Array.from(contractorSubMap.entries()).map(
      ([key, value]) => {
        const [primeContractorId, subContractorId] = key.split('|')
        return {
          source: `contractor-${primeContractorId}`,
          target: `contractor-${subContractorId}`,
          type: 'contractor-subcontractor' as const,
          weight: value.totalSubValue,
          linkCount: value.linkCount,
        }
      }
    )

    // Contractor risk scores summary
    const contractorRiskScores = contractors.map((c) => ({
      contractorId: c.id,
      contractorName: c.name,
      riskScore: c.riskScore,
    }))

    return Response.json({
      nodes: [...agencyNodes, ...contractorNodes],
      edges: [...agencyContractorEdges, ...contractorSubcontractorEdges],
      contractorRiskScores,
      summary: {
        totalNodes: agencyNodes.length + contractorNodes.length,
        agencyNodes: agencyNodes.length,
        contractorNodes: contractorNodes.length,
        totalEdges: agencyContractorEdges.length + contractorSubcontractorEdges.length,
        agencyContractorEdges: agencyContractorEdges.length,
        contractorSubcontractorEdges: contractorSubcontractorEdges.length,
      },
    })
  } catch (error) {
    console.error('Relationships API error:', error)
    return Response.json(
      { error: 'Failed to fetch relationship data' },
      { status: 500 }
    )
  }
}
