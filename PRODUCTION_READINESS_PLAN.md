# Production Readiness And AI Automation Plan

## Target Product

`AI-Powered DCA Control Tower - GenAI Workflow Automation Platform`

The goal is to turn the existing DCA management platform into a resume-worthy AI automation project for an internship role requiring Python, LangChain, LangGraph, OpenAI APIs, PostgreSQL, APIs, JSON, webhooks, document extraction, classification, summarization, reporting dashboards, and business-process automation.

## Feasibility Summary

This upgrade is feasible with the current architecture.

Current strengths:

- Next.js dashboard already exists.
- Supabase/PostgreSQL is already used.
- FastAPI ML service already exists.
- RBAC, audit logs, SLA, reports, notifications, DCAs, and cases already exist.
- The business domain naturally fits AI workflow automation.

Main blockers before AI feature work:

- TypeScript currently fails.
- ESLint currently fails.
- Supabase account/project connection must be verified.
- Supabase generated types are likely stale.
- Existing Docker images are old.
- ML service environment/security configuration needs cleanup.

## Safest Implementation Order

### Phase 0 - Baseline And Branch

Priority: P0

Tasks:

- Create a working branch such as `codex/production-readiness`.
- Capture current test/lint/type-check/build state.
- Decide package manager: pnpm or npm.
- Do not add new features in this phase.

Expected output:

- Stable branch.
- Known baseline.
- Clear package manager decision.

Move forward when:

- The team agrees to stabilize before adding AI features.

### Phase 1 - Setup And Integration Verification

Priority: P0

Tasks:

- Verify GitHub remote and branch strategy.
- Verify CI install commands match package manager.
- Verify Docker daemon and `docker compose config`.
- Verify Supabase project ref and account.
- Verify Supabase migrations are applied to the intended project.
- Verify Supabase auth redirect URLs.
- Normalize environment variables:
  - `ML_SERVICE_URL` for server-to-server ML calls.
  - `NEXT_PUBLIC_APP_URL` for frontend links.
  - Keep service-role key server-only.

Expected output:

- Verified integration checklist.
- Correct Supabase project/account.
- Clean environment variable map.

Move forward when:

- Supabase connectivity is confirmed.
- CI install is reliable.
- Docker config validates.

### Phase 2 - Runtime Bug Fixing

Priority: P0

Tasks:

- Fix API handlers using `_request` but referencing `request`.
- Fix API handlers using `_user` but referencing `user`.
- Fix missing imports such as `createClient`.
- Fix API wrapper/signature mismatches.
- Keep behavior unchanged while fixing runtime errors.

Expected output:

- No obvious API runtime crashes.
- TypeScript error count reduced sharply.

Move forward when:

- Type-check has no missing variable/import errors.

### Phase 3 - Supabase Types And Database Cleanup

Priority: P0/P1

Tasks:

- Regenerate `apps/web/lib/supabase/database.types.ts`.
- Reduce unnecessary `(supabase as any)` casts.
- Verify migration order.
- Verify RLS on sensitive tables.
- Verify audit immutability.
- Decide and document whether manual case creation is allowed.

Expected output:

- Current database types.
- Verified database governance.

Move forward when:

- Type-check is near clean.
- RLS behavior is tested or manually verified.

### Phase 4 - Existing Feature Stabilization

Priority: P1

Tasks:

- Verify role dashboards.
- Verify case lifecycle.
- Verify DCA allocation.
- Verify SLA breach detection.
- Verify notifications.
- Verify reports export.
- Finish MFA enrollment or explicitly scope it out of MVP.

Expected output:

- Existing platform is stable enough for AI upgrade.

Move forward when:

- Core workflows are manually tested with seeded users.

### Phase 5 - AI Data Model

Priority: P1

Tasks:

- Add tables:
  - `ai_documents`
  - `ai_document_classifications`
  - `ai_extractions`
  - `ai_workflows`
  - `ai_workflow_events`
  - `ai_approvals`
  - `ai_agency_risk_scores`
  - `webhook_events`
- Add RLS policies.
- Add Supabase storage bucket for uploaded documents.
- Add indexes for workflow status and document lookup.

Expected output:

- Database ready for AI document workflows.

Move forward when:

- Migrations apply cleanly in staging/local.

### Phase 6 - FastAPI AI Automation Service

Priority: P1

Tasks:

- Add LangChain, LangGraph, and OpenAI-compatible client dependencies.
- Add Pydantic schemas for document classification and extraction.
- Add routers:
  - `document_ai.py`
  - `workflows.py`
  - `sla_risk.py`
  - `assistant.py`
- Add service modules:
  - LLM client
  - Supabase repository
  - document text extraction
  - webhook emitter

Expected output:

- Python service can classify/extract/summarize from text input.

Move forward when:

- FastAPI tests/manual calls return validated JSON.

### Phase 7 - LangGraph Workflow MVP

Priority: P1

Workflow:

```text
Upload document
classify document
extract structured data
validate extracted data
compare with SLA/allocation rules
generate AI summary
assign risk level
if high risk -> manager approval
update dashboard data
write audit log
emit webhook
```

Nodes:

- `load_document`
- `classify_document`
- `extract_data`
- `validate_data`
- `compare_rules`
- `generate_summary`
- `assign_risk`
- `approval_gate`
- `update_database`
- `write_audit_log`
- `emit_webhook`
- `handle_failure`

Expected output:

- End-to-end workflow record from upload to completion/pending approval.

Move forward when:

- A sample document produces classification, extraction, risk, and dashboard records.

### Phase 8 - Frontend AI Workflow UI

Priority: P1

Pages/components:

- `/documents`
- `/documents/[id]`
- `/ai-workflows`
- `/ai-workflows/[id]`
- `/approvals`
- `/ai-dashboard`
- `DocumentUploadPanel`
- `WorkflowTimeline`
- `ExtractedJsonViewer`
- `ApprovalQueue`
- `ApprovalDecisionModal`
- `AgencyRiskCard`
- `AIWorkflowMetrics`

Expected output:

- User can upload, review workflow status, and approve high-risk decisions.

Move forward when:

- Manager approval loop works end to end.

### Phase 9 - Webhooks

Priority: P2

Events:

- `new_report_uploaded`
- `sla_breach_detected`
- `high_risk_agency_detected`
- `manager_approval_required`
- `workflow_completed`
- `workflow_failed`

Tasks:

- Store outbound webhook attempts.
- Add retry count and last error.
- Add signing secret later if needed.

Expected output:

- Automation-ready webhook event tracking.

Move forward when:

- At least one local/test webhook target receives events.

### Phase 10 - Natural Language Dashboard Assistant

Priority: P2

Use safe backend tools only. Do not let the assistant generate raw SQL.

Tools:

- `get_agency_sla_metrics`
- `get_high_risk_agencies`
- `get_monthly_recovery_summary`
- `get_agency_allocation_reason`
- `get_pending_manager_reviews`

Expected output:

- Assistant answers dashboard questions using safe API-backed tools.

Move forward when:

- Assistant answers sample questions without direct DB access.

### Phase 11 - Production Docker And Deployment

Priority: P1/P2

Tasks:

- Rebuild Docker images after app stabilization.
- Fix ML Docker healthcheck if `curl` is unavailable.
- Remove service-role key from ML service unless absolutely required.
- Deploy staging.
- Apply migrations safely.
- Configure HTTPS/domain.

Expected output:

- Staging deployment works end to end.

Move forward when:

- Staging passes smoke tests.

### Phase 12 - Monitoring And Portfolio Polish

Priority: P2

Tasks:

- Add structured logs.
- Add request IDs.
- Extend health checks.
- Add workflow metrics:
  - total workflows
  - pending approvals
  - failed workflows
  - average processing time
  - high-risk agencies
  - token usage
- Add README architecture diagram and screenshots.
- Add sample demo document.
- Add resume bullets.

Expected output:

- Internship-ready portfolio presentation.

## MVP Scope

Build first:

- Upload `.pdf` or `.txt` report.
- Extract text.
- Classify document.
- Extract structured JSON.
- Validate JSON.
- Store result in Supabase.
- Run LangGraph workflow.
- Create manager approval if high risk.
- Show workflow dashboard.
- Approve/reject/override.
- Write audit log.
- Emit webhook event.

Do not build first:

- RAG/pgvector.
- n8n live integration.
- complex legal analysis.
- multi-document batch workflow.
- custom model training.
- advanced assistant memory.

## Recommended Portfolio Pitch

Built an AI-powered business-process automation platform for DCA operations using Next.js, FastAPI, Supabase/PostgreSQL, LangGraph, LangChain, and OpenAI APIs. The system classifies uploaded operational documents, extracts structured JSON, runs auditable workflow automation, flags high-risk agencies, routes manager approvals, emits webhooks, and updates reporting dashboards.
