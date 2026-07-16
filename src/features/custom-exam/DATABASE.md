# Custom MCQ Exam Creator — Database Schema

## Models

### Exam

Central exam record. Custom exams are created with `creatorId` set.

```prisma
model Exam {
  id                String     @id @default(cuid())
  title             String
  description       String?
  classLevel        String
  type              String     // "MCQ"
  duration          Int        // minutes
  totalMarks        Int        @default(0)
  marksPerMcq       Float      @default(1)
  negativeMarks     Float      @default(0)
  passingPercentage Float?     // pass threshold (e.g. 40 = 40%)
  isPremium         Boolean    @default(false)
  isActive          Boolean    @default(true)
  status            String     @default("DRAFT")
  creatorId         String?    // FK → User (custom exam creator)
  createdAt         DateTime
  updatedAt         DateTime

  questions ExamQuestion[]
  results   ExamResult[]
  sessions  ExamSession[]
}
```

### ExamQuestion

Join table linking Exam to MCQ questions.

```prisma
model ExamQuestion {
  id           String   @id @default(cuid())
  examId       String   // FK → Exam (CASCADE)
  questionType String   // "mcq"
  questionId   String   // FK → MCQ.id
  order        Int      @default(0)
  marks        Float    @default(0)

  @@unique([examId, questionType, questionId])
}
```

### ExamResult

Stores each attempt's result. Supports multiple attempts per user per exam.

```prisma
model ExamResult {
  id               String   @id @default(cuid())
  userId           String   // FK → User (CASCADE)
  examId           String   // FK → Exam (CASCADE)
  attemptNumber    Int      @default(1)
  score            Float    @default(0)
  totalMarks       Float    @default(0)
  percentage       Float    @default(0)
  isPassed         Boolean?
  timeTaken        Int      @default(0) // seconds (server-calculated)
  answers          String   // JSON: {questionId: "A"}
  idempotencyKey   String?  @unique
  createdAt        DateTime
  completedAt      DateTime

  @@unique([userId, examId, attemptNumber])
}
```

### ExamSession

Server-side session tracking for exam integrity.

```prisma
model ExamSession {
  id                   String   @id @default(cuid())
  userId               String   // FK → User (CASCADE)
  examId               String   // FK → Exam (CASCADE)
  startedAt            DateTime @default(now())
  expiresAt            DateTime
  status               String   @default("IN_PROGRESS")
  currentQuestionIndex Int      @default(0)
  answers              String   @default("{}")
  lastActivityAt       DateTime @default(now())

  @@unique([userId, examId, status])
}
```

### MCQ

Question pool. Custom exams select from this.

```prisma
model MCQ {
  id               String   @id @default(cuid())
  question         String
  optionA/B/C/D    String
  correctAnswer    String   // "A", "B", "C", or "D"
  explanation      String?
  chapterId        String   // FK → Chapter
  difficulty       String   @default("MEDIUM") // EASY, MEDIUM, HARD
  isPremium        Boolean  @default(false)
  isActive         Boolean  @default(true)
}
```

## Relationships

```
User
  ├── Exam (creatorId)          — exams created by user
  ├── ExamResult (userId)       — exam attempts
  └── ExamSession (userId)      — active sessions

Exam
  ├── ExamQuestion[]            — linked questions
  ├── ExamResult[]              — all results
  └── ExamSession[]             — all sessions

MCQ
  └── Chapter
        └── Subject
              └── ClassCategory
```

## Key Constraints

| Constraint | Purpose |
|------------|---------|
| `@@unique([examId, questionType, questionId])` | No duplicate questions in same exam |
| `@@unique([userId, examId, attemptNumber])` | Unique attempt numbering |
| `@@unique([userId, examId, status])` | One active session per user per exam |
| `@@unique([idempotencyKey])` | Prevent duplicate submissions |

## Cascade Deletes

- Deleting a User cascades to ExamResult, ExamSession
- Deleting an Exam cascades to ExamQuestion, ExamResult, ExamSession
- Custom exams use soft delete (isActive=false) to preserve history
