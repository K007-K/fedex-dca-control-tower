# Repository-First Enterprise Security & Architecture Audit Plan

You must audit this project based only on the actual repository files. Do not
assume any file, role, route, database table, API, service, workflow, ML
endpoint, UI screen, or business rule exists unless it is found in the codebase.

This audit must be evidence-based, file-grounded, and line-specific.

---

## Core Rule

Before giving any finding, first verify it from the repository.

Do not hallucinate:

- File names
- API routes
- User roles
- Database tables
- RLS policies
- UI pages
- ML endpoints
- Business workflows
- Security issues
- Architecture layers
- Deployment setup
- Testing setup

If something is not found, write:

```md
Not found in repository.
```

If something is partially found, write:

```md
Partially found. Evidence: <file path and line/block reference>
```

---

# Phase 0: Repository Discovery First

Before auditing, scan the full repository and create an inventory.

## Tasks

1. List all top-level folders.
2. Identify the technology stack from actual files.
3. Identify all frontend apps if present.
4. Identify all backend/API folders if present.
5. Identify all database/migration folders if present.
6. Identify all authentication-related files if present.
7. Identify all authorization/RBAC-related files if present.
8. Identify all UI components if present.
9. Identify all hooks/context/state files if present.
10. Identify all ML/Python service files if present.
11. Identify all deployment/configuration files if present.
12. Identify all test files if present.

## Output File

Create:

```md
repo_inventory.md
```

Use this format:

```md
# Repository Inventory

## Top-Level Structure

| Path | Purpose | Evidence |
| ---- | ------- | -------- |

## Detected Tech Stack

| Technology | Evidence File | Confidence |
| ---------- | ------------- | ---------- |

## Discovered Areas

| Area                | Found? | Paths |
| ------------------- | ------ | ----- |
| Frontend            | Yes/No |       |
| API Routes          | Yes/No |       |
| Database Migrations | Yes/No |       |
| Auth                | Yes/No |       |
| RBAC                | Yes/No |       |
| ML Service          | Yes/No |       |
| Tests               | Yes/No |       |
| Deployment Config   | Yes/No |       |
```

Do not proceed to detailed auditing until this inventory is complete.

---

# Phase 1: Security-Critical Discovery

After repository inventory, identify only the actual security-relevant files.

## Search for

- Authentication logic
- Authorization logic
- Middleware
- API route handlers
- Database clients
- Supabase clients if present
- API key handling if present
- Environment variable usage
- Secrets usage
- Service-role/admin clients
- Row Level Security policies if present
- SQL migrations if present
- Webhook handling if present
- File upload handling if present
- External API integrations if present

## Output File

Create:

```md
security_surface_map.md
```

Use this format:

```md
# Security Surface Map

| Area | File/Folder | What It Controls | Risk Level | Notes |
| ---- | ----------- | ---------------- | ---------- | ----- |
```

---

# Phase 2: Database & Migration Audit

Only perform this phase if database files or migrations exist.

## Tasks

Audit every discovered SQL migration or schema file.

Check for:

- RLS enabled or missing
- Unsafe policies
- Overly broad access rules
- Missing tenant/user isolation
- Dangerous `USING (true)` or `WITH CHECK (true)`
- Missing foreign keys
- Missing indexes
- Unsafe triggers/functions
- Dangerous `SECURITY DEFINER`
- Mutable audit fields
- Weak constraints
- Dangerous cascade deletes
- Duplicate or conflicting migrations

## Required Evidence

Every finding must include:

- File path
- SQL block or line reference
- Exact issue
- Risk
- Recommended fix

## Output File

Create:

```md
database_audit.md
```

If no database files exist, write:

```md
No database or migration files found in repository.
```

---

# Phase 3: Authentication & Authorization Audit

Only audit files discovered in the repository.

## Tasks

Check:

- Login/session handling
- Middleware behavior
- Protected route enforcement
- API authentication
- Server-side role checks
- Frontend-only authorization mistakes
- API key validation if present
- Admin/service client misuse if present
- Cross-user or cross-tenant access risks

## Important Rule

Do not assume roles exist. First discover roles from code, database, constants,
enums, or documentation.

Create a role matrix only from discovered roles.

## Output Files

Create:

```md
auth_audit.md role_permission_matrix.md
```

If roles are not found, write:

```md
No explicit role system found in repository.
```

---

# Phase 4: API Route & Backend Audit

Only audit actual API/backend files.

## Tasks

For each discovered API route or backend endpoint, check:

- Is authentication required?
- Is authorization enforced?
- Is request input validated?
- Are route params sanitized?
- Are query params validated?
- Are database queries safe?
- Is sensitive data leaked in responses?
- Are errors handled safely?
- Are correct HTTP status codes used?
- Is rate limiting needed?
- Is logging safe?
- Is pagination required for list endpoints?

## Output File

Create:

```md
api_audit.md
```

Use this format:

```md
# API Audit

| Endpoint/File | Auth Check | Role Check | Input Validation | Main Risk | Severity | Fix |
| ------------- | ---------- | ---------- | ---------------- | --------- | -------- | --- |
```

---

# Phase 5: Core Business Logic Audit

Only audit business logic that actually exists in the repository.

## Tasks

Identify business logic files by scanning services, utilities, actions,
workflows, state machines, or domain folders.

For each discovered business flow, check:

- Correct state transitions
- Permission enforcement
- Data consistency
- Edge cases
- Duplicate action prevention
- Race conditions
- Audit trail creation if required
- Failure handling
- Timezone/date correctness if relevant

## Output File

Create:

```md
business_logic_audit.md
```

Do not invent workflows. Only document workflows found in code.

---

# Phase 6: Frontend UI/UX & Component Audit

Only audit actual frontend files.

## Tasks

Scan all discovered frontend pages, layouts, components, hooks, and context
files.

Check:

- Missing loading states
- Missing error states
- Missing empty states
- Broken responsive behavior
- Accessibility issues
- Keyboard navigation
- Focus states
- Form validation
- Table usability
- Modal behavior
- Navigation consistency
- Hydration or SSR issues
- Overuse of client components
- Unnecessary re-renders
- Memory leaks in hooks
- Duplicated UI logic
- Inconsistent design system usage

## Important Rule

Do not assume every role has a dashboard. First discover pages and role-based UI
from code.

## Output Files

Create:

```md
frontend_audit.md component_audit.md ui_ux_audit.md
```

---

# Phase 7: TypeScript, Runtime Validation & Code Quality Audit

Only perform this phase if TypeScript or JavaScript files exist.

## Tasks

Check:

- `any` usage
- Unsafe type assertions
- Missing return types
- Inconsistent API response types
- Missing runtime validation
- Weak form validation
- Duplicated logic
- Dead code
- Overly large files
- Poor separation of concerns
- Circular imports
- Naming inconsistencies
- Poor error handling

## Output File

Create:

```md
typescript_code_quality_audit.md
```

---

# Phase 8: Python / ML Service Audit

Only perform this phase if Python or ML service files exist.

## Tasks

Check:

- FastAPI/Flask/Django configuration if present
- CORS setup
- Auth enforcement
- Input validation
- Error handling
- Database connection handling
- Model loading behavior
- Edge-case handling
- Empty input handling
- Missing value handling
- Outlier handling
- Prediction consistency
- Logging safety
- Health checks
- Deployment readiness

## Important Rule

Do not assume ML endpoints exist. First discover Python routes/endpoints from
actual code.

## Output File

Create:

```md
python_ml_audit.md
```

If no Python/ML files exist, write:

```md
No Python or ML service files found in repository.
```

---

# Phase 9: Environment, Deployment & Dependency Audit

Audit only discovered configuration files.

## Search for

- `.env.example`
- package manager files
- lockfiles
- Docker files
- CI/CD workflows
- Vercel/Netlify config
- Supabase config
- Python dependency files
- build scripts
- deployment scripts

## Tasks

Check:

- Secrets committed accidentally
- Public/private environment variable misuse
- Missing `.env.example`
- Unsafe production defaults
- Outdated dependencies
- Vulnerable dependencies
- Build script issues
- Missing lint/typecheck scripts
- Missing migration safety steps
- Missing rollback strategy
- Missing health checks

## Output File

Create:

```md
deployment_dependency_audit.md
```

---

# Phase 10: Testing Gap Audit

Only audit tests that actually exist.

## Tasks

Find test files and identify coverage gaps.

Check whether the project has tests for:

- Authentication
- Authorization
- API routes
- Database policies
- Business workflows
- UI components
- Forms
- Hooks
- Error states
- ML endpoints if present
- Security edge cases

## Output File

Create:

```md
testing_gap_audit.md
```

If no tests exist, write:

```md
No test suite found in repository.
```

---

# Severity Levels

Classify every issue using:

## Critical

Direct security risk, data leak, privilege escalation, broken authentication,
exposed secret, production-breaking issue.

## High

Serious reliability, authorization, data corruption, or business logic issue.

## Medium

Performance, maintainability, UX, validation, or scalability issue.

## Low

Polish, consistency, naming, formatting, or minor improvement.

---

# Required Issue Format

Every issue must follow this exact format:

```md
## Issue ID: <CATEGORY-001>

### Title

Clear issue title.

### Severity

Critical / High / Medium / Low

### File

Exact file path.

### Evidence

Exact code block, line number, or function name.

### Problem

Explain what is wrong.

### Risk

Explain the real impact.

### Recommended Fix

Explain the correct solution.

### Suggested Patch

Provide code only if the fix is clear.

### Verification Steps

Explain how to confirm the issue is fixed.
```

---

# Final Output Files

Create these files only if relevant based on repository discovery:

```md
repo_inventory.md security_surface_map.md database_audit.md auth_audit.md
role_permission_matrix.md api_audit.md business_logic_audit.md frontend_audit.md
component_audit.md ui_ux_audit.md typescript_code_quality_audit.md
python_ml_audit.md deployment_dependency_audit.md testing_gap_audit.md
final_audit_results.md remediation_roadmap.md task.md
```

---

# Final Audit Report

The final report must include:

```md
# Final Audit Results

## Repository Summary

## Confirmed Tech Stack

## Confirmed Architecture

## Critical Findings

## High Findings

## Medium Findings

## Low Findings

## Missing or Incomplete Areas

## Security Risks

## Architecture Risks

## UI/UX Risks

## Backend/API Risks

## Database Risks

## ML/Python Risks

## Deployment Risks

## Testing Gaps

## Recommended Fix Order

## Files That Need Immediate Attention

## Files That Are Safe / No Major Issues Found
```

---

# Most Important Instruction

Do not generate assumptions.

First discover. Then verify. Then audit. Then report. Then recommend fixes.

Every statement must be backed by actual repository evidence.
ok