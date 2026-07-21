import { db } from './seed-db'
import { ensureSuperAdmin } from '../src/lib/seed-super-admin'
import { seedHierarchy } from './seed-data/01-hierarchy.seed'
import { seedUsers } from './seed-data/02-users.seed'
import { seedContentTypes } from './seed-data/03-content-types.seed'
import { seedPermissions } from './seed-data/04-permissions.seed'
import { seedNavigation } from './seed-data/05-navigation.seed'
import { seedSettings } from './seed-data/06-settings.seed'
import { seedBlogCategories } from './seed-data/07-blog-categories.seed'
import { seedTeachers } from './seed-data/08-teachers.seed'
import { seedLectures } from './seed-data/09-lectures.seed'
import { seedMCQs } from './seed-data/10-mcqs.seed'
import { seedCQs } from './seed-data/11-cqs.seed'
import { seedKnowledge } from './seed-data/12-knowledge.seed'
import { seedSuggestions } from './seed-data/13-suggestions.seed'
import { seedExams } from './seed-data/14-exams.seed'
import { seedMCQExamPackages } from './seed-data/15-mcq-exam-packages.seed'
import { seedCQExamPackages } from './seed-data/16-cq-exam-packages.seed'
import { seedBundles } from './seed-data/17-bundles.seed'
import { seedPackages } from './seed-data/18-packages.seed'
import { seedHomepage } from './seed-data/19-homepage.seed'
import { seedCourses } from './seed-data/20-courses.seed'
import { seedBlogPosts } from './seed-data/21-blog-posts.seed'
import { seedPayments } from './seed-data/22-payments.seed'
import { seedActivity } from './seed-data/23-activity.seed'
import { seedNotifications } from './seed-data/24-notifications.seed'
import { seedAnalytics } from './seed-data/25-analytics.seed'
import { seedWorkflow } from './seed-data/26-workflow.seed'
import { seedAudit } from './seed-data/27-audit.seed'
import { seedContacts } from './seed-data/28-contacts.seed'

async function main() {
  console.log('🌱 Starting production seed...')

  // Phase 1: Foundation
  console.log('\n📦 Phase 1/6 — Foundation')
  await seedHierarchy(db)
  await ensureSuperAdmin(db)
  await seedUsers(db)
  await seedContentTypes(db)
  await seedPermissions(db)
  await seedNavigation(db)
  await seedSettings(db)
  await seedBlogCategories(db)
  await seedTeachers(db)

  // Phase 2: Content
  console.log('\n📦 Phase 2/6 — Content')
  await seedLectures(db)
  await seedMCQs(db)
  await seedCQs(db)
  await seedKnowledge(db)
  await seedSuggestions(db)

  // Phase 3: Courses & Exams
  console.log('\n📦 Phase 3/6 — Courses & Exams')
  await seedExams(db)
  await seedMCQExamPackages(db)
  await seedCQExamPackages(db)
  await seedBundles(db)
  await seedPackages(db)
  await seedHomepage(db)
  await seedCourses(db)

  // Phase 4: Blog & Payments
  console.log('\n📦 Phase 4/6 — Blog & Payments')
  await seedBlogPosts(db)
  await seedPayments(db)

  // Phase 5: Activity
  console.log('\n📦 Phase 5/6 — Activity')
  await seedActivity(db)
  await seedNotifications(db)
  await seedAnalytics(db)

  // Phase 6: Audit & Workflow
  console.log('\n📦 Phase 6/6 — Audit & Workflow')
  await seedWorkflow(db)
  await seedAudit(db)
  await seedContacts(db)

  console.log('\n✅ Seed complete! All models seeded.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
