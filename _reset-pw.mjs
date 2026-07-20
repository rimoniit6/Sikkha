import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const db = createClient({ url: 'file:./db/custom.db' });
const hash = bcrypt.hashSync('admin123', 12);
await db.execute("UPDATE User SET password = ? WHERE email = 'admin@localhost'", [hash]);
console.log('Password updated. Hash:', hash);
const r = await db.execute("SELECT email, password FROM User WHERE email = 'admin@localhost'");
console.log('Verify admin123:', bcrypt.compareSync('admin123', r.rows[0].password));
