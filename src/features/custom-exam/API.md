# Custom MCQ Exam Creator — API Reference

## POST /api/create-exam

Create a new custom exam from selected chapters.

**Auth Required:** Yes  
**CSRF Required:** Yes  
**Rate Limited:** Yes

**Request Body:**
```json
{
  "chapterIds": ["ch_1", "ch_2"],
  "questionCount": 20,
  "duration": 30,
  "negativeMarks": 0.5,
  "marksPerMcq": 1,
  "title": "My Custom Exam",
  "freeOnly": false,
  "difficulty": "MEDIUM"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "examId": "exam_xxx",
    "hadPremiumFilter": false,
    "hasSubscription": true,
    "classSlug": "class-8"
  }
}
```

**Errors:**
- 400: No chapters selected, too many chapters (>20)
- 401: Not authenticated
- 404: No MCQs found for selected chapters/difficulty

---

## GET /api/create-exam/check-access

Check subscription access for a class.

**Auth Required:** Yes

**Query Params:** `classSlug` (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "hasAccess": true,
    "classSlug": "class-8",
    "subscription": { "packageName": "...", "endDate": "..." },
    "packages": [...]
  }
}
```

---

## POST /api/exams/session

Start or resume an exam session.

**Auth Required:** Yes  
**CSRF Required:** Yes

**Request Body:**
```json
{ "examId": "exam_xxx" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "sess_xxx",
    "examId": "exam_xxx",
    "startedAt": "2024-01-01T10:00:00Z",
    "expiresAt": "2024-01-01T10:30:00Z",
    "durationMinutes": 30
  }
}
```

---

## GET /api/exams/session/:id

Get current session state.

**Auth Required:** Yes (must be session owner)

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "sess_xxx",
    "examId": "exam_xxx",
    "status": "IN_PROGRESS",
    "answers": { "mcq_1": "A", "mcq_2": "B" },
    "currentQuestionIndex": 5
  }
}
```

---

## PATCH /api/exams/session/:id

Update session activity (answers, question index).

**Auth Required:** Yes (must be session owner)  
**CSRF Required:** Yes

**Request Body:**
```json
{
  "answers": { "mcq_1": "A" },
  "currentQuestionIndex": 5
}
```

---

## GET /api/exams/:id

Fetch exam with questions.

**Auth Required:** Optional (answers only for admins)

**Response:**
```json
{
  "success": true,
  "data": {
    "exam": {
      "id": "exam_xxx",
      "title": "...",
      "questions": [
        {
          "id": "mcq_1",
          "text": "Question text",
          "options": [{ "key": "A", "text": "Option A" }],
          "correctAnswer": "A",
          "explanation": "..."
        }
      ]
    }
  }
}
```

---

## POST /api/exams/results

Submit exam answers. Score calculated server-side.

**Auth Required:** Yes  
**CSRF Required:** Yes  
**Rate Limited:** Yes

**Request Body:**
```json
{
  "examId": "exam_xxx",
  "sessionId": "sess_xxx",
  "timeTaken": 1200,
  "answers": { "mcq_1": "A", "mcq_2": "C" },
  "idempotencyKey": "uuid_xxx"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "resultId": "result_xxx",
    "attemptNumber": 1,
    "score": 18,
    "totalMarks": 20,
    "percentage": 90,
    "isPassed": true,
    "correct": 18,
    "wrong": 2,
    "skipped": 0
  }
}
```

**Security:**
- Session must be IN_PROGRESS and not expired
- Score calculated server-side from DB stored answers
- Duplicate submissions prevented via idempotencyKey

---

## GET /api/exams/results/detail

Get detailed result with question review.

**Auth Required:** Yes (must be result owner or admin)

**Query Params:** `resultId` (required)

---

## GET /api/exams/my-exams

List exams created by the current user.

**Auth Required:** Yes

**Query Params:** `page`, `limit`, `search`

---

## DELETE /api/exams/:id/delete

Soft delete a custom exam.

**Auth Required:** Yes (must be exam owner or admin)  
**CSRF Required:** Yes  
**Rate Limited:** Yes

---

## GET /api/exams/analytics

Get analytics for a custom exam.

**Auth Required:** Yes (must be exam creator)

**Query Params:** `examId` (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "examId": "...",
    "totalAttempts": 5,
    "averageScore": 72,
    "bestScore": 95,
    "chapterPerformance": [...],
    "weakTopics": [...],
    "strongTopics": [...],
    "improvementTrend": [...]
  }
}
```
