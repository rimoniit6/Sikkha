import { createClient } from '@libsql/client';
import { join } from 'path';

const dbUrl = `file:${join(process.cwd(), 'db', 'custom.db')}`;
const libsql = createClient({ url: dbUrl });

async function main() {
  // Get super admin users
  const users = await libsql.execute("SELECT id, email, name FROM User WHERE role = 'SUPER_ADMIN' LIMIT 3");
  console.log('ADMINS:', JSON.stringify(users.rows));

  // Get MCQ records that are NOT deleted
  const mcqs = await libsql.execute("SELECT id, question, deletedAt, deletedBy FROM MCQ LIMIT 5");
  console.log('MCQs:', JSON.stringify(mcqs.rows));

  // Get total counts
  const total = await libsql.execute("SELECT COUNT(*) as c FROM MCQ");
  console.log('Total MCQs:', total.rows[0].c);

  // Get deleted count
  const deleted = await libsql.execute("SELECT COUNT(*) as c FROM MCQ WHERE deletedAt IS NOT NULL");
  console.log('Deleted MCQs:', deleted.rows[0].c);

  // Get FAQ records
  const faqs = await libsql.execute("SELECT id, question, deletedAt FROM FAQ LIMIT 5");
  console.log('FAQs:', JSON.stringify(faqs.rows));
}
main().catch(console.error);
