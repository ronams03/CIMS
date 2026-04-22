import { db } from '@/lib/db'

export async function GET() {
  try {
    const contractors = await db.contractor.findMany({
      select: {
        id: true,
        name: true,
        registrationId: true,
      },
      orderBy: { name: 'asc' },
    })

    return Response.json({ contractors })
  } catch (error) {
    console.error('Contractors API error:', error)
    return Response.json(
      { error: 'Failed to fetch contractors' },
      { status: 500 }
    )
  }
}
