import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cacheHeaders } from '@/lib/cache-headers'
import { handleApiError } from '@/lib/errors'

// GET /api/years - Public: list active years
export async function GET() {
  try {
    const years = await db.examYear.findMany({
      where: { isActive: true },
      orderBy: { order: 'desc' },
      select: { id: true, year: true },
    })
    return NextResponse.json({ success: true, data: years }, { headers: cacheHeaders.public.long })
  } catch (error) {
    return handleApiError(error, 'Years list error:')
  }
}
