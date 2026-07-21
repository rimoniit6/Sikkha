-- Add hash column to AuditLog for tamper detection
-- hash: SHA-256 digest of (action|entityType|entityId|adminId|createdAt)
-- Computed from the entry's own data only (no race condition).
-- Pre-migration entries will have NULL hash and are skipped during verification.

ALTER TABLE "AuditLog" ADD COLUMN "hash" TEXT;
CREATE INDEX "AuditLog_hash_idx" ON "AuditLog"("hash");
