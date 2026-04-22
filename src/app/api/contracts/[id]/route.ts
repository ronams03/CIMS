import { db } from '@/lib/db'

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
