import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

const VALID_AWARD_METHODS = ['competitive', 'sole-source', 'emergency'] as const
const VALID_STATUSES = ['active', 'completed', 'terminated', 'modified'] as const

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      contractId,
      title,
      description,
      agencyId,
      primeContractorId,
      category,
      initialValue,
      totalObligated,
      awardMethod,
      status,
      bidDate,
      awardDate,
      endDate,
    } = body

    // Validate required fields
    if (!contractId || typeof contractId !== 'string') {
      return Response.json(
        { error: 'contractId is required and must be a string' },
        { status: 400 }
      )
    }
    if (!title || typeof title !== 'string') {
      return Response.json(
        { error: 'title is required and must be a string' },
        { status: 400 }
      )
    }
    if (!agencyId || typeof agencyId !== 'string') {
      return Response.json(
        { error: 'agencyId is required and must be a string' },
        { status: 400 }
      )
    }
    if (!primeContractorId || typeof primeContractorId !== 'string') {
      return Response.json(
        { error: 'primeContractorId is required and must be a string' },
        { status: 400 }
      )
    }
    if (!category || typeof category !== 'string') {
      return Response.json(
        { error: 'category is required and must be a string' },
        { status: 400 }
      )
    }
    if (initialValue === undefined || initialValue === null || typeof initialValue !== 'number') {
      return Response.json(
        { error: 'initialValue is required and must be a number' },
        { status: 400 }
      )
    }
    if (totalObligated === undefined || totalObligated === null || typeof totalObligated !== 'number') {
      return Response.json(
        { error: 'totalObligated is required and must be a number' },
        { status: 400 }
      )
    }
    if (!awardMethod || !VALID_AWARD_METHODS.includes(awardMethod)) {
      return Response.json(
        { error: `awardMethod is required and must be one of: ${VALID_AWARD_METHODS.join(', ')}` },
        { status: 400 }
      )
    }
    if (!awardDate) {
      return Response.json(
        { error: 'awardDate is required' },
        { status: 400 }
      )
    }

    const resolvedStatus = status ?? 'active'
    if (!VALID_STATUSES.includes(resolvedStatus as typeof VALID_STATUSES[number])) {
      return Response.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Check for duplicate contractId
    const existing = await db.contract.findUnique({ where: { contractId } })
    if (existing) {
      return Response.json(
        { error: 'A contract with this contractId already exists' },
        { status: 409 }
      )
    }

    // Verify agency and contractor exist
    const [agency, contractor] = await Promise.all([
      db.agency.findUnique({ where: { id: agencyId } }),
      db.contractor.findUnique({ where: { id: primeContractorId } }),
    ])

    if (!agency) {
      return Response.json(
        { error: 'Agency not found' },
        { status: 400 }
      )
    }
    if (!contractor) {
      return Response.json(
        { error: 'Prime contractor not found' },
        { status: 400 }
      )
    }

    const contract = await db.contract.create({
      data: {
        contractId,
        title,
        description: description ?? '',
        agencyId,
        primeContractorId,
        category,
        initialValue,
        totalObligated,
        awardMethod,
        status: resolvedStatus,
        bidDate: bidDate ? new Date(bidDate) : null,
        awardDate: new Date(awardDate),
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        agency: true,
        primeContractor: true,
      },
    })

    return Response.json({ contract }, { status: 201 })
  } catch (error) {
    console.error('Contract creation error:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return Response.json(
        { error: 'A contract with this contractId already exists' },
        { status: 409 }
      )
    }
    return Response.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    )
  }
}

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
