import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const agency = searchParams.get('agency')
    const awardMethod = searchParams.get('awardMethod')
    const status = searchParams.get('status')
    const minValue = searchParams.get('minValue')
    const maxValue = searchParams.get('maxValue')
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '20', 10)

    const where: Prisma.ContractWhereInput = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    if (category) {
      where.category = category
    }

    if (agency) {
      where.agency = { code: agency }
    }

    if (awardMethod) {
      where.awardMethod = awardMethod
    }

    if (status) {
      where.status = status
    }

    if (minValue || maxValue) {
      where.totalObligated = {}
      if (minValue) {
        (where.totalObligated as Prisma.FloatFilter).gte = parseFloat(minValue)
      }
      if (maxValue) {
        (where.totalObligated as Prisma.FloatFilter).lte = parseFloat(maxValue)
      }
    }

    const [contracts, totalCount] = await Promise.all([
      db.contract.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { awardDate: 'desc' },
        select: {
          id: true,
          contractId: true,
          title: true,
          description: true,
          category: true,
          totalObligated: true,
          initialValue: true,
          awardMethod: true,
          status: true,
          awardDate: true,
          endDate: true,
          agency: {
            select: { name: true, code: true },
          },
          primeContractor: {
            select: { name: true, id: true },
          },
          _count: {
            select: {
              modifications: true,
              riskSignals: true,
            },
          },
        },
      }),
      db.contract.count({ where }),
    ])

    const results = contracts.map((contract) => ({
      id: contract.id,
      contractId: contract.contractId,
      title: contract.title,
      description: contract.description,
      category: contract.category,
      totalObligated: contract.totalObligated,
      initialValue: contract.initialValue,
      awardMethod: contract.awardMethod,
      status: contract.status,
      awardDate: contract.awardDate,
      endDate: contract.endDate,
      agencyName: contract.agency.name,
      agencyCode: contract.agency.code,
      primeContractorName: contract.primeContractor.name,
      primeContractorId: contract.primeContractor.id,
      modificationCount: contract._count.modifications,
      riskSignalCount: contract._count.riskSignals,
    }))

    return Response.json({
      contracts: results,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Contracts API error:', error)
    return Response.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    )
  }
}
