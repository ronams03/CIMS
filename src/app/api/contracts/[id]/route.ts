import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

const VALID_AWARD_METHODS = ['competitive', 'sole-source', 'emergency'] as const
const VALID_STATUSES = ['active', 'completed', 'terminated', 'modified'] as const

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const contract = await db.contract.findUnique({
      where: { id },
      include: {
        agency: true,
        primeContractor: true,
        modifications: {
          orderBy: { modNumber: 'asc' },
        },
        subcontractors: {
          include: {
            contractor: true,
          },
        },
        riskSignals: true,
      },
    })

    if (!contract) {
      return Response.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    return Response.json({ contract })
  } catch (error) {
    console.error('Contract detail API error:', error)
    return Response.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Verify contract exists
    const existing = await db.contract.findUnique({ where: { id } })
    if (!existing) {
      return Response.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    // Build update data with only provided fields
    const data: Prisma.ContractUpdateInput = {}

    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description
    if (body.category !== undefined) data.category = body.category
    if (body.initialValue !== undefined) data.initialValue = body.initialValue
    if (body.totalObligated !== undefined) data.totalObligated = body.totalObligated
    if (body.awardMethod !== undefined) {
      if (!VALID_AWARD_METHODS.includes(body.awardMethod)) {
        return Response.json(
          { error: `awardMethod must be one of: ${VALID_AWARD_METHODS.join(', ')}` },
          { status: 400 }
        )
      }
      data.awardMethod = body.awardMethod
    }
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return Response.json(
          { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
          { status: 400 }
        )
      }
      data.status = body.status
    }
    if (body.awardDate !== undefined) data.awardDate = new Date(body.awardDate)
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null

    // Relational updates
    if (body.agencyId !== undefined) {
      const agency = await db.agency.findUnique({ where: { id: body.agencyId } })
      if (!agency) {
        return Response.json({ error: 'Agency not found' }, { status: 400 })
      }
      data.agency = { connect: { id: body.agencyId } }
    }
    if (body.primeContractorId !== undefined) {
      const contractor = await db.contractor.findUnique({ where: { id: body.primeContractorId } })
      if (!contractor) {
        return Response.json({ error: 'Prime contractor not found' }, { status: 400 })
      }
      data.primeContractor = { connect: { id: body.primeContractorId } }
    }

    const contract = await db.contract.update({
      where: { id },
      data,
      include: {
        agency: true,
        primeContractor: true,
        modifications: { orderBy: { modNumber: 'asc' } },
        subcontractors: { include: { contractor: true } },
        riskSignals: true,
      },
    })

    return Response.json({ contract })
  } catch (error) {
    console.error('Contract update error:', error)
    return Response.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify contract exists
    const existing = await db.contract.findUnique({ where: { id } })
    if (!existing) {
      return Response.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    // Delete related records first (SQLite doesn't support cascade)
    await db.riskSignal.deleteMany({ where: { contractId: id } })
    await db.subcontractorLink.deleteMany({ where: { contractId: id } })
    await db.contractModification.deleteMany({ where: { contractId: id } })
    await db.contract.delete({ where: { id } })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Contract delete error:', error)
    return Response.json(
      { error: 'Failed to delete contract' },
      { status: 500 }
    )
  }
}
