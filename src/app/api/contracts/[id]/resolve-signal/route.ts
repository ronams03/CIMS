import { db } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { signalId } = body

    if (!signalId || typeof signalId !== 'string') {
      return Response.json(
        { error: 'signalId is required and must be a string' },
        { status: 400 }
      )
    }

    // Verify the risk signal exists and belongs to this contract
    const riskSignal = await db.riskSignal.findUnique({
      where: { id: signalId },
    })

    if (!riskSignal) {
      return Response.json(
        { error: 'Risk signal not found' },
        { status: 404 }
      )
    }

    if (riskSignal.contractId !== id) {
      return Response.json(
        { error: 'Risk signal does not belong to this contract' },
        { status: 400 }
      )
    }

    if (riskSignal.isResolved) {
      return Response.json(
        { error: 'Risk signal is already resolved' },
        { status: 400 }
      )
    }

    const updated = await db.riskSignal.update({
      where: { id: signalId },
      data: { isResolved: true },
    })

    return Response.json({ riskSignal: updated })
  } catch (error) {
    console.error('Resolve signal error:', error)
    return Response.json(
      { error: 'Failed to resolve risk signal' },
      { status: 500 }
    )
  }
}
