import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const db = createClient({ url: 'file:./db/custom.db' });

const r = await db.execute("SELECT id, email, password FROM User WHERE email = 'admin@localhost' LIMIT 1");
const user = r.rows[0];
console.log('Stored hash:', user.password);
console.log('Verify ChangeMe123!:', bcrypt.compareSync('ChangeMe123!', user.password));
console.log('Verify admin123:', bcrypt.compareSync('admin123', user.password));
