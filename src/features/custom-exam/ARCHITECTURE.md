# Custom MCQ Exam Creator — Architecture

## Overview

The Custom MCQ Exam Creator allows authenticated students to generate personalized MCQ exams by selecting chapters from the class/subject hierarchy. The system supports timed sessions, server-side scoring, multiple attempts, and analytics.

## Components

### Client Components

| Component | Path | Purpose |
|-----------|------|---------|
| CreateExamPage | `src/components/create-exam/CreateExamPage.tsx` | 4-step exam creation wizard |
| ExamSessionPage | `src/components/exam/ExamSessionPage.tsx` | Timed exam-taking interface |
| ExamResultPage | `src/components/exam/ExamResultPage.tsx` | Post-exam result display |
| CreatorExamHistoryPage | `src/components/exam/CreatorExamHistoryPage.tsx` | User's exam history list |
| CreatorExamResultReviewPage | `src/components/exam/CreatorExamResultReviewPage.tsx` | Detailed question review |
| CustomExamHistory | `src/components/user/dashboard/CustomExamHistory.tsx` | Dashboard widget |

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/create-exam` | POST | Create custom exam from chapters |
| `/api/create-exam/check-access` | GET | Check subscription status |
| `/api/exams/session` | POST | Start/resume exam session |
| `/api/exams/session/:id` | GET/PATCH | Get/update session state |
| `/api/exams/:id` | GET | Fetch exam with questions |
| `/api/exams/:id/delete` | DELETE | Soft delete exam |
| `/api/exams/results` | POST | Submit exam answers |
| `/api/exams/results/detail` | GET | Get detailed result |
| `/api/exams/my-exams` | GET | List user's exams |
| `/api/exams/analytics` | GET | Get exam analytics |

### Service Layer

| Service | Path | Purpose |
|---------|------|---------|
| ExamService | `src/services/exam-service.ts` | Core business logic |

### State Management

| Store | Path | Purpose |
|-------|------|---------|
| useExamStore | `src/store/exam.ts` | Zustand store with localStorage persistence |

## Data Flow

```
User → CreateExamPage → POST /api/create-exam → Exam record created
         ↓
      navigate('exam-session')
         ↓
User → ExamSessionPage → POST /api/exams/session → Session created
         ↓                    ↓
      Fetch questions    Store sessionId
         ↓
      Timer countdown (server-side)
         ↓
      User answers → PATCH /api/exams/session/:id (periodic sync)
         ↓
      Submit → POST /api/exams/results → Score calculated server-side
         ↓
      navigate('exam-result')
         ↓
User → ExamResultPage → GET /api/exams/results/detail → Display results
```

## Security Model

1. **Authentication**: All APIs require valid session cookie
2. **Ownership**: Every resource validated against `userId`
3. **Server-side scoring**: Client sends answers, server calculates score
4. **Session tracking**: Server-side timestamps prevent timer manipulation
5. **CSRF protection**: POST routes require CSRF token
6. **Rate limiting**: Applied to mutation endpoints
7. **IDOR prevention**: All queries include userId filter
