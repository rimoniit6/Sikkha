import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter, pick } from './00-helpers'

export async function seedAnalytics(db: PrismaClient) {
  resetCounter()

  const users = await db.user.findMany({ where: { isVerified: true } })

  // Analytics Events
  const eventTypes = ['page_view', 'lecture_view', 'mcq_answer', 'exam_start', 'exam_submit', 'purchase', 'login', 'register', 'search', 'bookmark']
  const pagePaths = ['/', '/classes', '/exams', '/mcq', '/cq', '/lectures', '/blog', '/premium', '/dashboard', '/search']

  for (let i = 0; i < 50; i++) {
    const user = users.length > 0 && i % 3 !== 0 ? pick(users) : null
    await db.analyticsEvent.create({
    data: {
      userId: user?.id ?? null,
      eventType: pick(eventTypes),
      eventName: pick(eventTypes).replace('_', ' '),
      entityType: pick(['lecture', 'mcq', 'exam', 'page', 'payment']),
      entityId: `eid_${i}`,
      metadata: JSON.stringify({ source: 'seed' }),
      sessionId: `sid_${i}`,
      url: pick(pagePaths),
      deviceType: pick(['mobile', 'desktop', 'tablet']),
      browser: pick(['Chrome', 'Firefox', 'Safari', 'Edge']),
      os: pick(['Windows', 'macOS', 'Linux', 'iOS', 'Android']),
      country: pick(['Bangladesh', 'India', 'USA', 'UK']),
      duration: Math.floor(Math.random() * 300),
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    },
  })
  }

  // Analytics Sessions
  for (let i = 0; i < 15; i++) {
    const user = pick(users)
    const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    const duration = Math.floor(Math.random() * 1800)
    await db.analyticsSession.create({
    data: {
      userId: user?.id ?? null,
      endTime: new Date(startTime.getTime() + duration * 1000),
      duration,
      pageViews: 3 + Math.floor(Math.random() * 20),
      events: 5 + Math.floor(Math.random() * 30),
      deviceType: pick(['mobile', 'desktop']),
      browser: pick(['Chrome', 'Firefox', 'Safari']),
      os: pick(['Windows', 'Android', 'iOS']),
      country: 'Bangladesh',
      referrer: pick(['https://google.com', 'https://facebook.com', 'https://youtube.com', '']),
      landingPage: pick(pagePaths),
    },
  })
  }

  // Analytics Search Queries
  const searchQueries = ['পদার্থবিজ্ঞান', 'গণিত', 'এসএসসি সাজেশন', 'এমসিকিউ অনুশীলন', 'এইচএসসি পরীক্ষা', 'বাংলা ব্যাকরণ', 'ইংরেজি গ্রামার', 'রসায়ন', 'জীববিজ্ঞান', 'উচ্চতর গণিত']
  for (const query of searchQueries) {
    const user = pick(users)
    await db.analyticsSearchQuery.create({
    data: {
      query,
      userId: user?.id ?? null,
      resultCount: Math.floor(Math.random() * 50),
      clicked: Math.random() > 0.3,
      createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
    },
  })
  }

  // Analytics Alerts
  const alerts = [
    { name: 'High Error Rate', description: 'Alert when error rate exceeds 5%', metric: 'error_rate', condition: 'gt', threshold: 5, timeframe: '1h' },
    { name: 'Low Registration', description: 'Alert when daily registrations drop below 10', metric: 'registrations', condition: 'lt', threshold: 10, timeframe: '24h' },
    { name: 'Revenue Drop', description: 'Alert when daily revenue drops below 1000', metric: 'revenue', condition: 'lt', threshold: 1000, timeframe: '24h' },
    { name: 'High Traffic', description: 'Alert when traffic exceeds 10000 visits/hour', metric: 'visits', condition: 'gt', threshold: 10000, timeframe: '1h' },
  ]
  for (const a of alerts) {
    const aalId = deterministicId('aal')
    await db.analyticsAlert.upsert({
      where: { id: aalId },
      update: {},
      create: { id: aalId, name: a.name, description: a.description, metric: a.metric, condition: a.condition, threshold: a.threshold, timeframe: a.timeframe },
    })
  }

  // Analytics Reports
  const reports = [
    { name: 'Daily Revenue Report', description: 'Daily revenue breakdown by payment method', type: 'revenue', format: 'xlsx', schedule: 'daily', recipients: 'admin@sikkha.com' },
    { name: 'Weekly Student Activity', description: 'Weekly active students and engagement metrics', type: 'students', format: 'xlsx', schedule: 'weekly', recipients: 'admin@sikkha.com' },
    { name: 'Monthly Performance', description: 'Monthly platform performance and growth metrics', type: 'conversion', format: 'pdf', schedule: 'monthly', recipients: 'admin@sikkha.com,ceo@sikkha.com' },
  ]
  for (const r of reports) {
    const arId = deterministicId('ar')
    await db.analyticsReport.upsert({
      where: { id: arId },
      update: {},
      create: { id: arId, name: r.name, description: r.description, type: r.type, format: r.format, schedule: r.schedule, recipients: r.recipients },
    })
  }
}
