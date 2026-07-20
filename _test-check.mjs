import { createClient } from '@libsql/client';
const db = createClient({ url: 'file:./db/custom.db' });

const r = await db.execute("SELECT id, deletedAt, deletedBy, question FROM FAQ WHERE id = 'cmrnutl4u00bnaofiyahz7eb1'");
console.log('DB record:', JSON.stringify(r.rows[0], null, 2));

// Also check if the record exists in MCQ or other models
const models = ['MCQ', 'CQ', 'FAQ', 'Banner', 'Notice', 'Testimonial', 'Board', 'Exam', 'BoardYear', 'ExamYear', 'Navigation', 'ContentType', 'ClassCategory', 'Subject', 'Chapter', 'Topic', 'KnowledgeQuestion', 'Lecture', 'Resource', 'Suggestion', 'Course', 'CourseLesson', 'ContentBundle', 'ContentPackage', 'MCQExamPackage', 'CQExamPackage', 'TeacherModerator', 'UserSubscription', 'MCQExamPackagePurchase', 'CQExamPackagePurchase', 'FeaturedContent'];
for (const m of models) {
  const x = await db.execute(`SELECT id FROM "${m}" WHERE id = 'cmrnutl4u00bnaofiyahz7eb1'`);
  if (x.rows.length > 0) {
    console.log(`Found in model: ${m}`);
  }
}
