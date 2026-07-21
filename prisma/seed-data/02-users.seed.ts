import type { PrismaClient } from '@prisma/client'
import { hashPassword } from '../../src/lib/password'
import { deterministicId, resetCounter, CLASSES, BOARDS, pick } from './00-helpers'

export async function seedUsers(db: PrismaClient) {
  resetCounter()

  const students: Array<{ email: string; name: string; role: string; classLevel: string; board: string; phone: string; isVerified: boolean; isPremium: boolean }> = [
    { email: 'rahul@student.com', name: 'রাহুল আহমেদ', role: 'STUDENT', classLevel: 'ssc', board: 'dhaka', phone: '01712345678', isVerified: true, isPremium: false },
    { email: 'fatema@student.com', name: 'ফাতেমা খাতুন', role: 'STUDENT', classLevel: 'ssc', board: 'rajshahi', phone: '01812345678', isVerified: true, isPremium: false },
    { email: 'sakib@student.com', name: 'সাকিব হাসান', role: 'STUDENT', classLevel: 'hsc', board: 'dhaka', phone: '01912345678', isVerified: true, isPremium: true },
    { email: 'nusrat@student.com', name: 'নুসরাত জাহান', role: 'STUDENT', classLevel: 'class-8', board: 'chittagong', phone: '01612345678', isVerified: true, isPremium: false },
    { email: 'tanvir@student.com', name: 'তানভীর ইসলাম', role: 'STUDENT', classLevel: 'class-6', board: 'sylhet', phone: '01722345678', isVerified: true, isPremium: false },
    { email: 'mim@student.com', name: 'মিম আক্তার', role: 'STUDENT', classLevel: 'class-7', board: 'comilla', phone: '01822345678', isVerified: true, isPremium: false },
    { email: 'arif@student.com', name: 'আরিফ হোসেন', role: 'STUDENT', classLevel: 'ssc', board: 'barishal', phone: '01922345678', isVerified: true, isPremium: false },
    { email: 'sadia@student.com', name: 'সাদিয়া ইসলাম', role: 'STUDENT', classLevel: 'hsc', board: 'dinajpur', phone: '01732345678', isVerified: true, isPremium: false },
    { email: 'rifat@student.com', name: 'রিফাত হাসান', role: 'STUDENT', classLevel: 'class-8', board: 'jessore', phone: '01832345678', isVerified: true, isPremium: false },
    { email: 'tahmina@student.com', name: 'তাহমিনা বেগম', role: 'STUDENT', classLevel: 'ssc', board: 'mymensingh', phone: '01932345678', isVerified: true, isPremium: true },
    { email: 'nayeem@student.com', name: 'নাঈম মিয়া', role: 'STUDENT', classLevel: 'hsc', board: 'rajshahi', phone: '01622345678', isVerified: true, isPremium: false },
    { email: 'sohel@student.com', name: 'সোহেল রানা', role: 'STUDENT', classLevel: 'class-7', board: 'chittagong', phone: '01742345678', isVerified: true, isPremium: false },
  ]

  const teachers = [
    { email: 'teacher1@sikkha.com', name: 'আব্দুর রহিম', role: 'STUDENT', classLevel: 'ssc', board: 'dhaka', phone: '01752345678' },
    { email: 'teacher2@sikkha.com', name: 'শাহিনুর বেগম', role: 'STUDENT', classLevel: 'hsc', board: 'dhaka', phone: '01852345678' },
  ]

  const admins = [
    { email: 'admin@admin.com', name: 'মডারেটর', role: 'ADMIN' as const },
    { email: 'admin2@sikkha.com', name: 'সহ-মডারেটর', role: 'ADMIN' as const },
  ]

  const pwd = hashPassword('password123')

  const allUsers = [
    ...admins,
    ...students.map(s => ({ email: s.email, name: s.name, role: s.role as const })),
    ...teachers.map(t => ({ email: t.email, name: t.name, role: t.role as const })),
  ]

  for (const u of allUsers) {
    const existing = await db.user.findUnique({ where: { email: u.email } })
    if (existing) {
      await db.user.update({
        where: { id: existing.id },
        data: { name: u.name, role: u.role, isVerified: true },
      })
    } else {
      await db.user.create({
    data: {
      id: deterministicId('usr'),
      email: u.email,
      name: u.name,
      password: pwd,
      role: u.role,
      isVerified: true,
      isPremium: u.role === 'ADMIN',
    },
  })
    }
  }

  for (const s of students) {
    const existing = await db.user.findUnique({ where: { email: s.email } })
    if (existing) {
      await db.user.update({
        where: { id: existing.id },
        data: { classLevel: s.classLevel, board: s.board, phone: s.phone, isPremium: s.isPremium },
      })
    } else {
      await db.user.create({
    data: {
      id: deterministicId('usr'),
      email: s.email,
      name: s.name,
      password: pwd,
      role: 'STUDENT',
      phone: s.phone,
      classLevel: s.classLevel,
      board: s.board,
      isVerified: true,
      isPremium: s.isPremium,
    },
  })
    }
  }

  for (const t of teachers) {
    const existing = await db.user.findUnique({ where: { email: t.email } })
    if (!existing) {
      await db.user.create({
    data: {
      id: deterministicId('usr'),
      email: t.email,
      name: t.name,
      password: pwd,
      role: 'STUDENT',
      classLevel: t.classLevel,
      board: t.board,
      phone: t.phone,
      isVerified: true,
    },
  })
    }
  }
}
