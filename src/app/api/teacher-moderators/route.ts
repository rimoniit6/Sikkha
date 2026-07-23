import { db } from '@/lib/db'
import { apiError } from '@/lib/api-utils'
import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/errors'

export async function GET() {
  try {
    const teachers = await db.teacherModerator.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ success: true, data: { teachers } })
  } catch (error) {
    return handleApiError(error, 'Get teacher-moderators error:')
  }
}
