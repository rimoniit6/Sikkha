---
name: sprint-implementation
description: Reusable workflow for sprint-based feature implementation - covers planning, implementation, integration, and verification
---

## When to Use

User requests feature implementation, sprint execution, or multi-step development work. This skill provides a structured, repeatable implementation workflow.

## Trigger Keywords

- "implement", "sprint", "feature", "build", "create"
- "phase", "iteration", "integration"
- "fix", "update", "enhance"

## Implementation Workflow

### Phase 1: Planning

1. **Understand requirements:**
   - Read user request thoroughly
   - Identify scope boundaries (what's in/out)
   - Check project memory for related architecture decisions
   - Review existing code for similar patterns

2. **Break down into tasks:**
   ```
   Sprint N.M: [Feature Name]
   
   Goal: [One-sentence objective]
   
   Models/Files affected:
   - [List of Prisma models]
   - [List of API routes]
   - [List of components]
   
   Implementation steps:
   1. [Step 1 with specific files]
   2. [Step 2 with specific files]
   3. ...
   
   Verification:
   - [How to verify each step]
   ```

3. **Check dependencies:**
   - What existing code can be reused?
   - What patterns are already established?
   - Are there any blockers?

### Phase 2: Implementation

1. **Follow established patterns:**
   - Use existing audit logging pattern: `import { auditFromRequest, AuditActions } from '@/lib/audit'`
   - Use existing auth patterns: `withAdmin()`, `requireAdmin()`, `withSuperAdmin()`
   - Use existing CSRF pattern: `csrfCheck()` after auth
   - Use existing soft delete pattern: `softDelete()` utility

2. **Implementation checklist:**
   - [ ] Database changes (schema.prisma)
   - [ ] Run `npx prisma generate` after schema changes
   - [ ] API routes with proper auth, CSRF, validation
   - [ ] Audit logging for all write operations
   - [ ] Frontend components with proper loading states
   - [ ] Error handling with user-friendly messages
   - [ ] Bengali UI labels with English route keys

3. **Code quality standards:**
   - TypeScript strict mode
   - Proper error boundaries
   - Loading states for async operations
   - Responsive design (mobile-first)
   - Dark mode support

### Phase 3: Integration

1. **Connect components:**
   - Wire API routes to frontend
   - Add navigation items (database-driven)
   - Integrate with existing state management
   - Add proper caching where needed

2. **Test integration points:**
   - Verify API responses match frontend expectations
   - Check loading and error states
   - Verify navigation works correctly
   - Test with different user roles

### Phase 4: Verification

1. **Functional testing:**
   - [ ] All CRUD operations work
   - [ ] Auth checks work for all roles
   - [ ] CSRF protection works
   - [ ] Input validation works
   - [ ] Error messages are clear

2. **Integration testing:**
   - [ ] Feature works end-to-end
   - [ ] Navigation works correctly
   - [ ] Loading states show properly
   - [ ] Error states show properly

3. **Edge cases:**
   - [ ] Empty states handled
   - [ ] Long text handled
   - [ ] Mobile responsive
   - [ ] Dark mode works

## Quality Standards

- **Completeness:** Implement all requirements, not just the happy path
- **Consistency:** Follow existing patterns exactly
- **Testability:** Code should be verifiable by reading
- **Maintainability:** Clean, well-structured code
- **User-friendly:** Clear error messages, loading states, empty states

## Common Implementation Patterns (Sikkha Project)

Based on project memory:

1. **API Route Pattern:**
   ```typescript
   import { withAdmin } from '@/lib/api-utils'
   import { csrfCheck } from '@/lib/csrf'
   import { auditFromRequest, AuditActions } from '@/lib/audit'
   
   export async function POST(request: Request) {
     const auth = await withAdmin(request)
     if (!auth) return unauthorized()
     
     await csrfCheck(request)
     
     // ... business logic ...
     
     await auditFromRequest(request, {
       action: AuditActions.ENTITY_CREATE,
       entityType: 'EntityType',
       entityId: record.id,
       newData: record
     })
     
     return success(data)
   }
   ```

2. **Frontend Component Pattern:**
   ```typescript
   'use client'
   
   import { useState } from 'react'
   import { useQuery, useMutation } from '@tanstack/react-query'
   import { Skeleton } from '@/components/ui/skeleton'
   import { EmptyState } from '@/components/shared/EmptyState'
   
   export function FeaturePage() {
     const { data, isLoading } = useQuery({...})
     const mutation = useMutation({...})
     
     if (isLoading) return <Skeleton />
     if (!data?.length) return <EmptyState />
     
     return <div>{/* content */}</div>
   }
   ```

3. **Database Pattern:**
   ```prisma
   model Entity {
     id            String   @id @default(cuid())
     name          String
     // ... other fields ...
     
     isActive      Boolean  @default(true)
     deletedAt     DateTime?
     deletedBy     String?
     deleteReason  String?
     
     createdAt     DateTime @default(now())
     updatedAt     DateTime @updatedAt
     
     @@index([isActive, deletedAt])
   }
   ```

## Anti-Patterns

- **Don't** implement without understanding existing patterns
- **Don't** skip audit logging for write operations
- **Don't** forget CSRF protection on POST/PUT/PATCH/DELETE
- **Don't** use hardcoded navigation (must be database-driven)
- **Don't** skip loading and error states
- **Don't** forget Bengali UI labels

## Integration with Existing Skills

- Use `production-audit` to verify implementation meets production standards
- Use `task-review` to save implementation workflow as reusable skill
