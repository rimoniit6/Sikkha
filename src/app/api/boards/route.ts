import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cacheHeaders } from '@/lib/cache-headers'
import { handleApiError } from '@/lib/errors'

// GET /api/boards - Public: list active boards
export async function GET() {
  try {
    const boards = await db.board.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, slug: true, color: true },
    })
    return NextResponse.json({ success: true, data: boards }, { headers: cacheHeaders.public.long })
  } catch (error) {
    return handleApiError(error, 'Boards list error:')
  }
}
