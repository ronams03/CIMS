import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const severity = searchParams.get('severity')
    const signalType = searchParams.get('signalType')

    const where: Prisma.RiskSignalWhereInput = {}

    if (severity) {
      where.severity = severity
    }

    if (signalType) {
      where.signalType = signalType
    }

    // All risk signals with contract details
    const riskSignals = await db.riskSignal.findMany({
      where,
      include: {
        contract: {
          select: {
            contractId: true,
            title: true,
            agency: { select: { name: true } },
            primeContractor: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedSignals = riskSignals.map((signal) => ({
      id: signal.id,
      signalType: signal.signalType,
      severity: signal.severity,
      description: signal.description,
      isResolved: signal.isResolved,
      createdAt: signal.createdAt,
      updatedAt: signal.updatedAt,
      contract: {
        id: signal.contractId,
        contractId: signal.contract.contractId,
        title: signal.contract.title,
        agencyName: signal.contract.agency.name,
        contractorName: signal.contract.primeContractor.name,
      },
    }))

    // Signal count by type
    const countByTypeRaw = await db.riskSignal.groupBy({
      by: ['signalType'],
      _count: true,
      where,
    })
    const countByType: Record<string, number> = {}
    for (const row of countByTypeRaw) {
      countByType[row.signalType] = row._count
    }

    // Signal count by severity
    const countBySeverityRaw = await db.riskSignal.groupBy({
      by: ['severity'],
      _count: true,
      where,
    })
    const countBySeverity: Record<string, number> = {}
    for (const row of countBySeverityRaw) {
      countBySeverity[row.severity] = row._count
    }

    return Response.json({
      riskSignals: formattedSignals,
      countByType,
      countBySeverity,
      total: formattedSignals.length,
      filters: {
        severity: severity ?? null,
        signalType: signalType ?? null,
      },
    })
  } catch (error) {
    console.error('Risk signals API error:', error)
    return Response.json(
      { error: 'Failed to fetch risk signals' },
      { status: 500 }
    )
  }
}
