import { db } from '@/lib/db'

const VALID_REASONS = ['scope change', 'extension', 'funding adjustment', 'other'] as const

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { description, valueChange, reason } = body

    // Validate required fields
    if (!description || typeof description !== 'string') {
      return Response.json(
        { error: 'description is required and must be a string' },
        { status: 400 }
      )
    }
    if (valueChange === undefined || valueChange === null || typeof valueChange !== 'number') {
      return Response.json(
        { error: 'valueChange is required and must be a number' },
        { status: 400 }
      )
    }
    if (!reason || !VALID_REASONS.includes(reason)) {
      return Response.json(
        { error: `reason is required and must be one of: ${VALID_REASONS.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify contract exists
    const contract = await db.contract.findUnique({
      where: { id },
      include: { modifications: true },
    })
    if (!contract) {
      return Response.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    // Calculate next modification number
    const maxModNumber = contract.modifications.length > 0
      ? Math.max(...contract.modifications.map(m => m.modNumber))
      : 0

    const modification = await db.contractModification.create({
      data: {
        contractId: id,
        modNumber: maxModNumber + 1,
        description,
        valueChange,
        reason,
        modDate: new Date(),
      },
    })

    // Update contract totalObligated
    await db.contract.update({
      where: { id },
      data: {
        totalObligated: contract.totalObligated + valueChange,
      },
    })

    return Response.json({ modification }, { status: 201 })
  } catch (error) {
    console.error('Modification creation error:', error)
    return Response.json(
      { error: 'Failed to create modification' },
      { status: 500 }
    )
  }
}
