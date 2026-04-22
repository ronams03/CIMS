import { db } from '@/lib/db'

export async function GET() {
  try {
    const agencies = await db.agency.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: { name: 'asc' },
    })

    return Response.json({ agencies })
  } catch (error) {
    console.error('Agencies API error:', error)
    return Response.json(
      { error: 'Failed to fetch agencies' },
      { status: 500 }
    )
  }
}
