---
name: production-audit
description: Reusable workflow for production readiness audits - covers security, performance, database, API, authentication, and deployment readiness
---

## When to Use

User requests a production audit, certification audit, security audit, performance audit, or any comprehensive system review. This skill provides a structured, repeatable audit workflow.

## Trigger Keywords

- "audit", "certification", "production readiness", "security audit", "performance audit"
- "review", "verify", "check production readiness"
- "hardening", "comprehensive audit"

## Audit Workflow

### Phase 1: Scope Definition

1. **Clarify audit scope** with user:
   - Full system audit vs. specific area (security, performance, database, API, auth, deployment)
   - Read-only vs. fix mode
   - Previous audit references (avoid re-auditing completed areas)

2. **Define audit criteria** based on scope:
   - Security: Authentication, authorization, CSRF, XSS, injection, rate limiting
   - Performance: Response times, caching, N+1 queries, bundle size
   - Database: Indexes, query performance, migrations, data integrity
   - API: Input validation, error handling, rate limiting, documentation
   - Deployment: CI/CD, Docker, monitoring, logging, health checks

### Phase 2: Systematic Review

1. **Code Review Pattern:**
   ```
   For each area:
   - Read relevant source files
   - Check against audit criteria
   - Document findings with severity (Critical/High/Medium/Low)
   - Provide specific file:line references
   ```

2. **Database Audit Pattern:**
   ```sql
   -- Check indexes
   SELECT * FROM sqlite_master WHERE type='index';
   
   -- Check query performance
   EXPLAIN QUERY PLAN SELECT ...;
   
   -- Check for missing indexes on frequently queried columns
   ```

3. **API Audit Pattern:**
   ```
   For each API route:
   - Check auth middleware (withAdmin, requireAdmin, etc.)
   - Check input validation (zod schemas)
   - Check CSRF protection
   - Check rate limiting
   - Check error handling
   - Check audit logging
   ```

### Phase 3: Findings Report

1. **Structure findings by severity:**
   - **Critical:** Immediate security risks, data loss risks
   - **High:** Performance bottlenecks, missing auth checks
   - **Medium:** Code quality issues, missing validations
   - **Low:** Best practices, minor improvements

2. **Include in each finding:**
   - Description of the issue
   - Affected files with line numbers
   - Impact assessment
   - Recommended fix with code example
   - Priority (P0/P1/P2/P3)

### Phase 4: Recommendations

1. **Prioritized action items** with estimated effort
2. **Quick wins** (can fix immediately)
3. **Architecture improvements** (require planning)
4. **Monitoring gaps** (observability improvements)

## Quality Standards

- **Specificity:** Every finding must reference exact file:line
- **Actionability:** Each recommendation must include code example
- **Severity accuracy:** Correctly assess impact (not everything is Critical)
- **Completeness:** Cover all aspects of the defined scope
- **Evidence-based:** Findings must be verifiable by reading the code

## Common Audit Areas (Sikkha Project)

Based on project memory, key areas to audit:
- Authentication & Authorization (already certified)
- Purchase System (already certified)
- Editorial Workflow (conditionally ready 92%)
- Soft Delete operations
- Audit logging coverage
- CSRF protection
- Rate limiting
- Database performance
- Frontend performance
- Deployment readiness

## Output Format

```markdown
# [Audit Type] Audit Report

## Executive Summary
- Overall Score: X/100
- Critical Issues: N
- High Issues: N
- Medium Issues: N
- Low Issues: N

## Findings

### Critical
1. [Finding Title]
   - **Files:** `path/to/file.ts:123`
   - **Impact:** Description
   - **Fix:** Code example

### High
...

## Recommendations
1. [Priority] [Action] - [Effort estimate]

## Appendix
- Audit methodology
- Files reviewed
- Tools used
```

## Anti-Patterns

- **Don't** re-audit areas already certified unless specifically requested
- **Don't** mix audit with implementation (audit-only mode by default)
- **Don't** provide vague findings without file references
- **Don't** skip severity assessment
- **Don't** ignore previous audit findings

## Integration with Existing Skills

- Use `coding-agent` for implementing fixes after audit
- Use `task-review` to save audit workflow as reusable skill
