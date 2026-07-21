-- DropIndex
DROP INDEX "Banner_isActive_idx";

-- DropIndex
DROP INDEX "CQ_board_year_classLevel_isActive_idx";

-- DropIndex
DROP INDEX "CQ_board_year_isActive_idx";

-- DropIndex
DROP INDEX "CQ_chapterId_isActive_idx";

-- DropIndex
DROP INDEX "CQ_classLevel_subjectId_chapterId_isActive_idx";

-- DropIndex
DROP INDEX "CQExamPackage_status_isActive_order_idx";

-- DropIndex
DROP INDEX "Chapter_subjectId_isActive_order_idx";

-- DropIndex
DROP INDEX "Exam_isActive_createdAt_idx";

-- DropIndex
DROP INDEX "Exam_subjectId_classLevel_isActive_idx";

-- DropIndex
DROP INDEX "Exam_status_isActive_idx";

-- DropIndex
DROP INDEX "Exam_classLevel_isActive_idx";

-- DropIndex
DROP INDEX "FAQ_isActive_category_idx";

-- DropIndex
DROP INDEX "KnowledgeQuestion_isPremium_isActive_idx";

-- DropIndex
DROP INDEX "KnowledgeQuestion_chapterId_type_isActive_idx";

-- DropIndex
DROP INDEX "Lecture_isPremium_isActive_idx";

-- DropIndex
DROP INDEX "Lecture_chapterId_isActive_idx";

-- DropIndex
DROP INDEX "MCQ_board_year_classLevel_isActive_idx";

-- DropIndex
DROP INDEX "MCQ_board_year_isActive_idx";

-- DropIndex
DROP INDEX "MCQ_chapterId_isActive_idx";

-- DropIndex
DROP INDEX "MCQ_classLevel_subjectId_chapterId_isActive_idx";

-- DropIndex
DROP INDEX "Notice_classLevel_isActive_idx";

-- DropIndex
DROP INDEX "Notice_isActive_type_order_createdAt_idx";

-- DropIndex
DROP INDEX "Subject_classId_isActive_order_idx";

-- DropIndex
DROP INDEX "Suggestion_isActive_classId_subjectId_idx";

-- DropIndex
DROP INDEX "Suggestion_isActive_chapterId_idx";

-- AlterTable
ALTER TABLE "Banner" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "Banner" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Banner" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "Board" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "Board" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Board" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "BoardYear" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "BoardYear" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "BoardYear" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "CQ" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "CQ" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "CQ" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "CQExamPackage" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "CQExamPackage" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "CQExamPackage" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "CQExamPackagePurchase" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "CQExamPackagePurchase" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "CQExamPackagePurchase" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "Chapter" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Chapter" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "ClassCategory" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "ClassCategory" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "ClassCategory" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "ContentBundle" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "ContentBundle" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "ContentBundle" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "ContentPackage" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "ContentPackage" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "ContentPackage" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "ContentType" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "ContentType" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "ContentType" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "Course" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Course" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "CourseLesson" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "CourseLesson" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "CourseLesson" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "Exam" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Exam" ADD COLUMN "deletedBy" TEXT;
ALTER TABLE "Exam" ADD COLUMN "passingPercentage" REAL;

-- AlterTable
ALTER TABLE "ExamYear" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "ExamYear" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "ExamYear" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "FAQ" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "FAQ" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "FAQ" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "FeaturedContent" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "FeaturedContent" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "FeaturedContent" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "KnowledgeQuestion" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "KnowledgeQuestion" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "KnowledgeQuestion" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "Lecture" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "Lecture" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Lecture" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "MCQ" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "MCQ" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "MCQ" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "MCQExamPackage" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "MCQExamPackage" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "MCQExamPackage" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "MCQExamPackagePurchase" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "MCQExamPackagePurchase" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "MCQExamPackagePurchase" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "Navigation" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "Navigation" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Navigation" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "Notice" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "Notice" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Notice" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "Resource" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Resource" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "Subject" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Subject" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "Suggestion" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "Suggestion" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Suggestion" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "TeacherModerator" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "TeacherModerator" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "TeacherModerator" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "Testimonial" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Testimonial" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "Topic" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Topic" ADD COLUMN "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "UserSubscription" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "UserSubscription" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "UserSubscription" ADD COLUMN "deletedBy" TEXT;

-- CreateTable
CREATE TABLE "ExamSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
    "answers" TEXT NOT NULL DEFAULT '{}',
    "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExamSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamSession_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL,
    "changedFields" TEXT,
    "changeType" TEXT NOT NULL,
    "rollbackFromVersion" INTEGER,
    "rollbackComment" TEXT,
    "performedBy" TEXT NOT NULL,
    "performedByName" TEXT,
    "performedByRole" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "serial" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" DATETIME,
    CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Certificate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Certificate_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "CourseEnrollment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentWorkflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "previousStatus" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "submittedBy" TEXT,
    "submittedAt" DATETIME,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "reviewComment" TEXT,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "publishedBy" TEXT,
    "publishedAt" DATETIME,
    "publishedVersionId" TEXT,
    "scheduledAt" DATETIME,
    "unpublishedAt" DATETIME,
    "rejectedBy" TEXT,
    "rejectedAt" DATETIME,
    "rejectionReason" TEXT,
    "archivedBy" TEXT,
    "archivedAt" DATETIME,
    "publishAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastPublishAttempt" DATETIME,
    "publishFailedAt" DATETIME,
    "publishError" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkflowHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performedByName" TEXT,
    "performedByRole" TEXT,
    "comment" TEXT,
    "versionNumber" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WorkflowComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "parentId" TEXT,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT,
    "authorRole" TEXT,
    "content" TEXT NOT NULL,
    "action" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldData" TEXT,
    "newData" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userName" TEXT,
    "userRole" TEXT,
    "status" TEXT NOT NULL DEFAULT 'success',
    "duration" INTEGER,
    "os" TEXT,
    "browser" TEXT,
    "country" TEXT,
    "sessionId" TEXT,
    "requestId" TEXT,
    "correlationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AuditLog" ("action", "adminId", "createdAt", "deletedAt", "entityId", "entityType", "id", "ipAddress", "newData", "oldData", "userAgent") SELECT "action", "adminId", "createdAt", "deletedAt", "entityId", "entityType", "id", "ipAddress", "newData", "oldData", "userAgent" FROM "AuditLog";
DROP TABLE "AuditLog";
ALTER TABLE "new_AuditLog" RENAME TO "AuditLog";
CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_status_idx" ON "AuditLog"("status");
CREATE INDEX "AuditLog_os_browser_idx" ON "AuditLog"("os", "browser");
CREATE INDEX "AuditLog_sessionId_idx" ON "AuditLog"("sessionId");
CREATE INDEX "AuditLog_requestId_idx" ON "AuditLog"("requestId");
CREATE INDEX "AuditLog_correlationId_idx" ON "AuditLog"("correlationId");
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
CREATE INDEX "AuditLog_adminId_createdAt_idx" ON "AuditLog"("adminId", "createdAt");
CREATE INDEX "AuditLog_entityType_action_idx" ON "AuditLog"("entityType", "action");
CREATE TABLE "new_CourseEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "type" TEXT NOT NULL DEFAULT 'FREE',
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" DATETIME,
    CONSTRAINT "CourseEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CourseEnrollment" ("completedAt", "courseId", "deletedAt", "enrolledAt", "id", "status", "type", "userId") SELECT "completedAt", "courseId", "deletedAt", "enrolledAt", "id", "status", "type", "userId" FROM "CourseEnrollment";
DROP TABLE "CourseEnrollment";
ALTER TABLE "new_CourseEnrollment" RENAME TO "CourseEnrollment";
CREATE INDEX "CourseEnrollment_userId_idx" ON "CourseEnrollment"("userId");
CREATE INDEX "CourseEnrollment_courseId_idx" ON "CourseEnrollment"("courseId");
CREATE INDEX "CourseEnrollment_status_idx" ON "CourseEnrollment"("status");
CREATE UNIQUE INDEX "CourseEnrollment_userId_courseId_key" ON "CourseEnrollment"("userId", "courseId");
CREATE TABLE "new_ExamResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "score" REAL NOT NULL DEFAULT 0,
    "totalMarks" REAL NOT NULL DEFAULT 0,
    "percentage" REAL NOT NULL DEFAULT 0,
    "isPassed" BOOLEAN,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "wrong" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "timeTaken" INTEGER NOT NULL DEFAULT 0,
    "answers" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "ExamResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamResult_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ExamResult" ("answers", "completedAt", "createdAt", "deletedAt", "examId", "id", "idempotencyKey", "score", "timeTaken", "totalMarks", "userId") SELECT "answers", "completedAt", "createdAt", "deletedAt", "examId", "id", "idempotencyKey", "score", "timeTaken", "totalMarks", "userId" FROM "ExamResult";
DROP TABLE "ExamResult";
ALTER TABLE "new_ExamResult" RENAME TO "ExamResult";
CREATE UNIQUE INDEX "ExamResult_idempotencyKey_key" ON "ExamResult"("idempotencyKey");
CREATE INDEX "ExamResult_userId_idx" ON "ExamResult"("userId");
CREATE INDEX "ExamResult_examId_idx" ON "ExamResult"("examId");
CREATE INDEX "ExamResult_userId_examId_idx" ON "ExamResult"("userId", "examId");
CREATE UNIQUE INDEX "ExamResult_userId_examId_attemptNumber_key" ON "ExamResult"("userId", "examId", "attemptNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ExamSession_userId_examId_status_idx" ON "ExamSession"("userId", "examId", "status");

-- CreateIndex
CREATE INDEX "ExamSession_userId_idx" ON "ExamSession"("userId");

-- CreateIndex
CREATE INDEX "ExamSession_examId_idx" ON "ExamSession"("examId");

-- CreateIndex
CREATE INDEX "ExamSession_status_idx" ON "ExamSession"("status");

-- CreateIndex
CREATE INDEX "ContentVersion_entityType_entityId_idx" ON "ContentVersion"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ContentVersion_createdAt_idx" ON "ContentVersion"("createdAt");

-- CreateIndex
CREATE INDEX "ContentVersion_performedBy_idx" ON "ContentVersion"("performedBy");

-- CreateIndex
CREATE INDEX "ContentVersion_changeType_idx" ON "ContentVersion"("changeType");

-- CreateIndex
CREATE UNIQUE INDEX "ContentVersion_entityType_entityId_versionNumber_key" ON "ContentVersion"("entityType", "entityId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_enrollmentId_key" ON "Certificate"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_serial_key" ON "Certificate"("serial");

-- CreateIndex
CREATE INDEX "Certificate_userId_idx" ON "Certificate"("userId");

-- CreateIndex
CREATE INDEX "Certificate_courseId_idx" ON "Certificate"("courseId");

-- CreateIndex
CREATE INDEX "Certificate_serial_idx" ON "Certificate"("serial");

-- CreateIndex
CREATE INDEX "ContentWorkflow_status_idx" ON "ContentWorkflow"("status");

-- CreateIndex
CREATE INDEX "ContentWorkflow_scheduledAt_idx" ON "ContentWorkflow"("scheduledAt");

-- CreateIndex
CREATE INDEX "ContentWorkflow_entityType_status_idx" ON "ContentWorkflow"("entityType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ContentWorkflow_entityType_entityId_key" ON "ContentWorkflow"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "WorkflowHistory_entityType_entityId_idx" ON "WorkflowHistory"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "WorkflowHistory_toStatus_idx" ON "WorkflowHistory"("toStatus");

-- CreateIndex
CREATE INDEX "WorkflowHistory_performedBy_idx" ON "WorkflowHistory"("performedBy");

-- CreateIndex
CREATE INDEX "WorkflowHistory_createdAt_idx" ON "WorkflowHistory"("createdAt");

-- CreateIndex
CREATE INDEX "WorkflowComment_entityType_entityId_idx" ON "WorkflowComment"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "WorkflowComment_parentId_idx" ON "WorkflowComment"("parentId");

-- CreateIndex
CREATE INDEX "WorkflowComment_authorId_idx" ON "WorkflowComment"("authorId");

-- CreateIndex
CREATE INDEX "Banner_isActive_deletedAt_idx" ON "Banner"("isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "CQ_classLevel_subjectId_chapterId_isActive_deletedAt_idx" ON "CQ"("classLevel", "subjectId", "chapterId", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "CQ_chapterId_isActive_deletedAt_idx" ON "CQ"("chapterId", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "CQ_board_year_isActive_deletedAt_idx" ON "CQ"("board", "year", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "CQ_board_year_classLevel_isActive_deletedAt_idx" ON "CQ"("board", "year", "classLevel", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "CQExamPackage_status_isActive_deletedAt_order_idx" ON "CQExamPackage"("status", "isActive", "deletedAt", "order");

-- CreateIndex
CREATE INDEX "Chapter_subjectId_isActive_deletedAt_order_idx" ON "Chapter"("subjectId", "isActive", "deletedAt", "order");

-- CreateIndex
CREATE INDEX "Exam_classLevel_isActive_deletedAt_idx" ON "Exam"("classLevel", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "Exam_status_isActive_deletedAt_idx" ON "Exam"("status", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "Exam_subjectId_classLevel_isActive_deletedAt_idx" ON "Exam"("subjectId", "classLevel", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "Exam_isActive_deletedAt_createdAt_idx" ON "Exam"("isActive", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "FAQ_isActive_deletedAt_category_idx" ON "FAQ"("isActive", "deletedAt", "category");

-- CreateIndex
CREATE INDEX "KnowledgeQuestion_chapterId_type_isActive_deletedAt_idx" ON "KnowledgeQuestion"("chapterId", "type", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "KnowledgeQuestion_isPremium_isActive_deletedAt_idx" ON "KnowledgeQuestion"("isPremium", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "Lecture_chapterId_isActive_deletedAt_idx" ON "Lecture"("chapterId", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "Lecture_isPremium_isActive_deletedAt_idx" ON "Lecture"("isPremium", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "MCQ_classLevel_subjectId_chapterId_isActive_deletedAt_idx" ON "MCQ"("classLevel", "subjectId", "chapterId", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "MCQ_chapterId_isActive_deletedAt_idx" ON "MCQ"("chapterId", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "MCQ_board_year_isActive_deletedAt_idx" ON "MCQ"("board", "year", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "MCQ_board_year_classLevel_isActive_deletedAt_idx" ON "MCQ"("board", "year", "classLevel", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "Notice_isActive_deletedAt_type_order_createdAt_idx" ON "Notice"("isActive", "deletedAt", "type", "order", "createdAt");

-- CreateIndex
CREATE INDEX "Notice_classLevel_isActive_deletedAt_idx" ON "Notice"("classLevel", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "Subject_classId_isActive_deletedAt_order_idx" ON "Subject"("classId", "isActive", "deletedAt", "order");

-- CreateIndex
CREATE INDEX "Suggestion_isActive_deletedAt_chapterId_idx" ON "Suggestion"("isActive", "deletedAt", "chapterId");

-- CreateIndex
CREATE INDEX "Suggestion_isActive_deletedAt_classId_subjectId_idx" ON "Suggestion"("isActive", "deletedAt", "classId", "subjectId");
