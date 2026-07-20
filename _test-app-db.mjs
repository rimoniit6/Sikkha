import { createClient } from '@libsql/client';
const db = createClient({ url: 'file:./db/custom.db' });
const r = await db.execute("SELECT id, deletedAt, deletedBy, question FROM FAQ WHERE id = 'cmrnutl4u00bnaofiyahz7eb1'");
console.log(JSON.stringify(r.rows[0]));
