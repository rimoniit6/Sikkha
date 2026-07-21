---
name: bug-investigation
description: Reusable workflow for forensic bug investigation - covers reproduction, root cause analysis, and fix verification
---

## When to Use

User reports a bug, error, or unexpected behavior. This skill provides a structured, forensic investigation workflow.

## Trigger Keywords

- "bug", "error", "fix", "issue", "problem"
- "not working", "broken", "fails", "crash"
- "unexpected behavior", "wrong result"

## Investigation Workflow

### Phase 1: Reproduction

1. **Gather information:**
   - What is the expected behavior?
   - What is the actual behavior?
   - Steps to reproduce
   - Error messages (exact text)
   - Screenshots if applicable

2. **Identify scope:**
   - Is it a frontend or backend issue?
   - Is it a database issue?
   - Is it an integration issue?
   - Does it affect all users or specific cases?

3. **Create minimal reproduction:**
   ```
   Steps to reproduce:
   1. [Step 1]
   2. [Step 2]
   3. [Step 3]
   
   Expected: [What should happen]
   Actual: [What actually happens]
   ```

### Phase 2: Investigation

1. **Trace the flow:**
   ```
   Frontend → API Route → Service/Logic → Database → Response
   
   For each step:
   - What inputs are passed?
   - What transformations occur?
   - What outputs are returned?
   ```

2. **Check common causes:**
   - [ ] Authentication/authorization issues
   - [ ] CSRF token missing/invalid
   - [ ] Input validation failures
   - [ ] Database query issues
   - [ ] Race conditions
   - [ ] Caching issues
   - [ ] State management issues
   - [ ] Hydration mismatches (Next.js)

3. **Use debugging tools:**
   - Read source files with context
   - Check database directly (if possible)
   - Trace API calls
   - Check console errors
   - Verify network requests

### Phase 3: Root Cause Analysis

1. **Identify the root cause:**
   - Not just the symptom
   - Not just the first error
   - The actual underlying issue

2. **Document the chain:**
   ```
   Root Cause: [Actual underlying issue]
   
   Chain of events:
   1. [Trigger]
   2. [Intermediate step]
   3. [Final symptom]
   ```

3. **Assess impact:**
   - How many users affected?
   - How severe is the impact?
   - Is it a regression?
   - Are there related issues?

### Phase 4: Fix Implementation

1. **Choose fix approach:**
   - Minimal fix (just fix the bug)
   - Proper fix (address root cause)
   - Defensive fix (prevent similar issues)

2. **Implement fix:**
   - Follow existing patterns
   - Add appropriate error handling
   - Add logging if needed
   - Update tests if they exist

3. **Verify fix:**
   - [ ] Bug is fixed
   - [ ] No regressions
   - [ ] Edge cases handled
   - [ ] Error messages clear

## Quality Standards

- **Thoroughness:** Investigate root cause, not just symptoms
- **Reproducibility:** Always reproduce before fixing
- **Minimalism:** Minimal fix unless structural issue
- **Documentation:** Document findings for future reference
- **Verification:** Always verify fix works

## Common Bug Patterns (Sikkha Project)

Based on project memory:

1. **Hydration Mismatch:**
   - Cause: Server/client rendering differences
   - Check: `useEffect` for client-only code, `suppressHydrationWarning`
   - Fix: Ensure consistent server/client rendering

2. **CSRF Errors:**
   - Cause: Missing or invalid CSRF token
   - Check: `x-csrf-token` header, `csrfCheck()` call
   - Fix: Ensure CSRF token is included in requests

3. **Database Query Issues:**
   - Cause: Missing indexes, N+1 queries, wrong filters
   - Check: `EXPLAIN QUERY PLAN`, Prisma queries
   - Fix: Add indexes, optimize queries

4. **State Management Issues:**
   - Cause: Zustand store not reset, stale data
   - Check: Store persistence, query invalidation
   - Fix: Proper store management, cache invalidation

5. **Navigation Issues:**
   - Cause: Database-driven navigation missing items
   - Check: Navigation seed endpoint, database records
   - Fix: Call seed endpoint, verify database

## Investigation Checklist

- [ ] Reproduce the issue
- [ ] Identify affected files
- [ ] Trace the flow
- [ ] Find root cause
- [ ] Assess impact
- [ ] Implement minimal fix
- [ ] Verify fix works
- [ ] Check for regressions
- [ ] Document findings

## Anti-Patterns

- **Don't** fix without understanding root cause
- **Don't** assume the first error is the root cause
- **Don't** skip reproduction
- **Don't** make unnecessary changes
- **Don't** forget to verify the fix

## Output Format

```markdown
# Bug Investigation Report

## Issue Summary
- **Bug:** [One-line description]
- **Impact:** [Who/what is affected]
- **Severity:** [Critical/High/Medium/Low]

## Reproduction
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected:** [What should happen]
**Actual:** [What actually happens]

## Root Cause
[Detailed explanation of the underlying issue]

## Fix
[Description of the fix]

**Files changed:**
- `path/to/file.ts:123` - [What changed]

## Verification
- [ ] Bug is fixed
- [ ] No regressions
- [ ] Edge cases handled

## Related Issues
[Any related bugs or patterns found]
```

## Integration with Existing Skills

- Use `production-audit` to check if bug indicates larger system issues
- Use `task-review` to save investigation workflow as reusable skill
