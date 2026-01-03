# FEDEX_ADMIN Governance Framework

## Overview

The **FEDEX_ADMIN** role is a **regional platform administrator** with governance and operational oversight capabilities. This document defines exactly what FEDEX_ADMIN can see and act upon.

> **Key Principle:** FEDEX_ADMIN has **regional authority only** - all visibility and actions are scoped to their assigned regions.

---

## 1. ROLE DEFINITION

| Attribute | Value |
|-----------|-------|
| Role Code | `FEDEX_ADMIN` |
| Display Name | FedEx Administrator |
| Scope | Regional (assigned regions only) |
| Type | Governance + Operational |
| Reports To | SUPER_ADMIN |

### Core Responsibilities
- Regional DCA performance management
- SLA enforcement and escalation handling
- User management within regional boundaries
- Risk identification and intervention
- Regional compliance reporting

### Authority Boundaries
- ✅ Full control within assigned regions
- ❌ Cannot access data outside assigned regions
- ❌ Cannot create SUPER_ADMIN or DCA users
- ❌ Cannot configure platform-wide settings

---

## 2. MODULE ACCESS MATRIX

| Module | Access | Scope | Key Actions |
|--------|--------|-------|-------------|
| Dashboard | ✅ Full | Regional | View KPIs, trends, alerts |
| Cases | ✅ Full | Regional | View, filter, reassign, escalate |
| DCAs | ✅ Full | Regional | Monitor, compare, suspend |
| SLA | ✅ Full | Regional | Monitor, trigger escalations |
| Analytics | ✅ Full | Regional | Analyze, compare DCAs, export |
| Reports | ✅ Full | Regional | Generate, schedule, export |
| Notifications | ✅ Full | Personal | Manage preferences, view alerts |
| Settings | ⚠️ Limited | Regional | User management, profile |

---

## 3. VISIBILITY

### What FEDEX_ADMIN Can See

| Data Type | Visibility | Scope Restriction |
|-----------|------------|-------------------|
| Cases | All case data, timelines | Assigned regions only |
| DCAs | Performance, metrics, status | Assigned regions only |
| Users | FedEx users in region | Cannot see DCA internal users |
| SLA Data | Templates, breaches, timers | Assigned regions only |
| Analytics | All metrics, trends | Regional only, no cross-region |
| Audit Logs | Actions within region | Own actions + regional activity |

### What FEDEX_ADMIN Cannot See

| Data Type | Reason |
|-----------|--------|
| Cases in other regions | Regional boundary enforcement |
| DCAs outside assigned regions | Regional scope |
| SUPER_ADMIN settings | Platform governance only |
| Platform Governance page | SUPER_ADMIN exclusive |
| Cross-region comparisons | Regional isolation |
| DCA internal user data | DCA operational boundary |

---

## 4. DASHBOARD

### Regional KPI Cards

| Card | Description | Data Scope |
|------|-------------|------------|
| Total Cases | Count of all cases | Assigned regions |
| Active DCAs | DCAs currently operating | Assigned regions |
| Recovery Rate | Regional recovery percentage | Assigned regions |
| SLA Compliance | % cases within SLA | Assigned regions |
| Outstanding Amount | Total debt outstanding | Assigned regions |
| Recovered Amount | Total recovered | Assigned regions |

### AI Insights Panel (Regional)

| Insight | Description |
|---------|-------------|
| Avg Priority Score | ML-assigned priority average for region |
| High-Risk Cases | Cases flagged as needing attention |
| Expected Recovery | AI-predicted recovery forecast |
| AI Confidence | Model confidence indicators |

### System Context Cards

| Card | Description |
|------|-------------|
| Active Region | Currently selected region indicator |
| Data Freshness | Last sync timestamp |
| ML Service Health | Read-only status indicator |
| Pending Actions | Cases awaiting allocation |

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Region Selector: [India ▼] [America] [Europe]  ← Only assigned │
├─────────────────────────────────────────────────────────────────┤
│  Regional KPIs                                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Cases   │ │ DCAs    │ │ Recovery │ │ SLA %   │ │ Outstd. │  │
│  │ 1,234   │ │ 12      │ │ 68.5%    │ │ 94.2%   │ │ ₹4.2Cr  │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐ ┌─────────────────────────┐       │
│  │ Regional Recovery Trend │ │ DCA Performance Ranking │       │
│  │ (Chart)                 │ │ (Regional DCAs only)    │       │
│  └─────────────────────────┘ └─────────────────────────┘       │
│                                                                 │
│  ┌─────────────────────────┐ ┌─────────────────────────┐       │
│  │ SLA At-Risk Cases       │ │ AI Insights (Regional)  │       │
│  └─────────────────────────┘ └─────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Dashboard Card Rules

| Rule | Implementation |
|------|----------------|
| Region scoping | All cards filtered by assigned regions |
| Currency | Adapts per selected region (INR, USD, EUR) |
| Trends | Show delta and direction |
| SLA context | Highlight at-risk with color coding |
| Refresh | Auto-refresh every 5 minutes |

---

## 5. CASES MODULE

### Permissions

| Action | Allowed | Notes |
|--------|---------|-------|
| View all cases | ✅ | Assigned regions only |
| Filter cases | ✅ | By DCA, status, SLA, priority |
| View case timeline | ✅ | Full history visible |
| Reassign to DCA | ✅ | Within same region |
| Trigger escalation | ✅ | For SLA breaches |
| Bulk export | ✅ | Regional data only |
| Change case status | ✅ | Operational capability |
| Add case notes | ✅ | Visible to all |

### Blocked Actions

| Action | Reason |
|--------|--------|
| Access cases outside region | Regional boundary |
| Perform DCA agent actions | Agent-level tasks |
| Delete cases | No delete capability |
| Modify case financials | Finance system only |

### Filter Options

```
Filters available to FEDEX_ADMIN:
- Region: [Assigned regions only]
- DCA: [DCAs in selected region]
- Status: [All statuses]
- Priority: [Critical, High, Medium, Low]
- SLA Status: [On Track, At Risk, Breached]
- Date Range: [Custom]
```

---

## 6. DCAs MODULE

### Permissions

| Action | Allowed | Notes |
|--------|---------|-------|
| View DCAs | ✅ | Assigned regions only |
| View performance metrics | ✅ | Full metrics access |
| Compare DCAs | ✅ | Within region only |
| Suspend DCA | ✅ | Temporary suspension |
| Reactivate DCA | ✅ | After suspension |
| View capacity | ✅ | Current workload |

### Blocked Actions

| Action | Reason |
|--------|--------|
| View DCAs outside region | Regional boundary |
| Create DCA users | DCA internal management |
| Manage DCA employees | DCA_ADMIN responsibility |
| Delete DCA | SUPER_ADMIN only |

### DCA Metrics Visible

| Metric | Description |
|--------|-------------|
| Active Cases | Current case count |
| Recovery Rate | % of cases recovered |
| SLA Compliance | % within SLA targets |
| Avg Recovery Days | Time to resolution |
| Capacity Utilization | Current vs max capacity |
| Performance Trend | 30-day trend indicator |

---

## 7. SLA MODULE

### Permissions

| Action | Allowed | Notes |
|--------|---------|-------|
| View SLA templates | ✅ | Regional templates |
| Monitor SLA timers | ✅ | Real-time status |
| View breaches | ✅ | All regional breaches |
| Trigger escalation | ✅ | For breached cases |
| Recommend SLA override | ⚠️ | Subject to policy |
| Create SLA template | ❌ | SUPER_ADMIN only |

### SLA Dashboard Components

| Component | Purpose |
|-----------|---------|
| At-Risk Cases | Cases approaching SLA deadline |
| Breach Queue | Currently breached cases |
| DCA SLA Ranking | DCAs by SLA performance |
| Escalation Queue | Cases pending escalation |
| SLA Trend | Regional SLA compliance over time |

---

## 8. ANALYTICS MODULE

### Scope Rules

| Rule | Enforcement |
|------|-------------|
| Region isolation | Analytics filtered to assigned regions |
| No cross-region | Cannot compare across regions |
| Export allowed | If permission granted |
| Historical data | Full history within region |

### Available Analytics

| Chart/Report | Description |
|--------------|-------------|
| Recovery Trends | Monthly/weekly recovery patterns |
| DCA Comparison | Performance comparison (regional DCAs) |
| SLA Breach Analysis | Breach patterns and causes |
| Escalation Patterns | When and why escalations occur |
| AI Priority Effectiveness | ML accuracy within region |
| Ageing Analysis | Case age distribution |
| Amount Distribution | Outstanding by bracket |

### Blocked Analytics

| Analytics | Reason |
|-----------|--------|
| Cross-region comparison | Regional isolation |
| Platform-wide trends | SUPER_ADMIN only |
| DCA cost analysis | Finance scope |

---

## 9. REPORTS MODULE

### Permissions

| Action | Allowed |
|--------|---------|
| Generate reports | ✅ Regional scope |
| Export CSV | ✅ |
| Export PDF | ✅ |
| Schedule reports | ✅ |
| Email reports | ✅ To authorized users |

### Available Report Types

| Report | Description |
|--------|-------------|
| Regional Performance Summary | KPIs and trends |
| DCA Performance Report | DCA comparison |
| SLA Compliance Report | SLA metrics |
| Escalation Report | Escalation analysis |
| Ageing Report | Case age breakdown |
| Recovery Analysis | Recovery performance |

---

## 10. NOTIFICATIONS

### Notifications FEDEX_ADMIN Receives

| Type | Priority | Dismissible | Channel |
|------|----------|-------------|---------|
| SLA_BREACH | 🔴 Critical | ❌ No | In-App, Email |
| ESCALATION_CREATED | 🔴 Critical | ❌ No | In-App, Email |
| DCA_PERFORMANCE_ALERT | 🟡 High | ✅ Yes | In-App |
| SYSTEM_ISSUE (regional) | 🟡 High | ✅ Yes | In-App |
| WEEKLY_DIGEST | 🟢 Low | ✅ Yes | Email |

### Notifications FEDEX_ADMIN Does NOT Receive

| Type | Reason |
|------|--------|
| Individual case updates | Agent-level detail |
| DCA internal notes | DCA operational |
| Platform-wide alerts | SUPER_ADMIN scope |
| Cases outside region | Regional boundary |

---

## 11. SETTINGS GOVERNANCE

### Settings Access Matrix

| Section | Access | Capabilities |
|---------|--------|--------------|
| Profile | ✅ | Edit display name only |
| Users | ⚠️ Limited | Manage regional FedEx users |
| Notifications | ✅ | Personal preferences |
| Security | ⚠️ Limited | Own password, sessions |
| Integrations | 👁️ View Only | Status only |
| Platform Governance | ❌ Hidden | SUPER_ADMIN exclusive |

### Profile Settings

| Field | Permission |
|-------|------------|
| Display Name | ✅ Editable |
| Email | 🔒 Read-only |
| Role | 🔒 Read-only |
| Assigned Regions | 🔒 Read-only |

### User Management

FEDEX_ADMIN can create/manage:

| Role | Can Create | Can Manage |
|------|------------|------------|
| FEDEX_MANAGER | ✅ | ✅ |
| FEDEX_ANALYST | ✅ | ✅ |
| AUDITOR | ✅ | ✅ |
| READONLY | ✅ | ✅ |
| SUPER_ADMIN | ❌ | ❌ |
| FEDEX_ADMIN | ❌ | ❌ (peer) |
| DCA_ADMIN | ❌ | ❌ |
| DCA_MANAGER | ❌ | ❌ |
| DCA_AGENT | ❌ | ❌ |

### User Management Rules

| Rule | Enforcement |
|------|-------------|
| Regional scope | Can only manage users in assigned regions |
| Role hierarchy | Cannot create roles >= own level |
| DCA isolation | Cannot access DCA internal users |
| Audit trail | All changes logged |

### Security Settings

| Feature | Access |
|---------|--------|
| Change own password | ✅ |
| View own sessions | ✅ |
| Terminate own sessions | ✅ |
| MFA configuration | ✅ Own account |
| Org-wide policies | ❌ SUPER_ADMIN only |

### Integrations Settings

| Feature | Access |
|---------|--------|
| View connection status | ✅ Read-only |
| View webhook status | ✅ Read-only |
| Regenerate API keys | ❌ SUPER_ADMIN only |
| Configure webhooks | ❌ SUPER_ADMIN only |

---

## 12. BACKEND ENFORCEMENT

### API Authorization Checks

```typescript
// Region enforcement for FEDEX_ADMIN
async function checkRegionAccess(userId: string, targetRegion: string) {
    const user = await getUser(userId);
    if (user.role !== 'FEDEX_ADMIN') return; // Other roles have different rules
    
    if (!user.assignedRegions.includes(targetRegion)) {
        throw new ForbiddenError('Access denied: region not assigned');
    }
}

// Role creation enforcement
function validateRoleCreation(creatorRole: string, newRole: string) {
    if (creatorRole === 'FEDEX_ADMIN') {
        const blocked = ['SUPER_ADMIN', 'FEDEX_ADMIN', 'DCA_ADMIN', 'DCA_MANAGER', 'DCA_AGENT'];
        if (blocked.includes(newRole)) {
            throw new ForbiddenError('Cannot create this role');
        }
    }
}
```

### Database RLS Policies

```sql
-- Cases: FEDEX_ADMIN sees only assigned regions
CREATE POLICY cases_fedex_admin ON cases
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_region_access ura
            JOIN users u ON u.id = ura.user_id
            WHERE u.id = auth.uid()
              AND u.role = 'FEDEX_ADMIN'
              AND ura.region_id = cases.region_id
              AND ura.revoked_at IS NULL
        )
    );

-- DCAs: Regional scope enforcement
CREATE POLICY dcas_fedex_admin ON dcas
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM region_dca_assignments rda
            JOIN user_region_access ura ON ura.region_id = rda.region_id
            WHERE ura.user_id = auth.uid()
              AND rda.dca_id = dcas.id
        )
    );
```

### Audit Logging

All FEDEX_ADMIN actions are logged:

| Action Type | Logged Fields |
|-------------|---------------|
| User created | New user details, role, regions |
| User modified | Changed fields, old/new values |
| Case reassigned | Case ID, from DCA, to DCA |
| DCA suspended | DCA ID, reason |
| Report generated | Report type, parameters |
| Escalation triggered | Case ID, reason |

---

## 13. IMPLEMENTATION STATUS

| Feature | Status | Verification |
|---------|--------|--------------|
| Regional visibility | ✅ Verified | `secureQuery` uses `accessibleRegions` |
| Dashboard KPIs | ✅ Hardened | Added region filter in `/api/dashboard` |
| Cases regional filter | ✅ Verified | Uses `secureQuery` with region column |
| DCAs regional scope | ✅ Verified | Uses `secureQuery` with region column |
| Analytics dashboard | ✅ Hardened | Added region filter for cases AND DCAs |
| User management | ✅ Hardened | Added `primary_region_id` filter |
| API key regeneration | ✅ Hardened | Backend blocks non-SUPER_ADMIN (403) |
| Settings restrictions | ✅ Hardened | UI + backend both enforce |
| Audit logging | ✅ Verified | All actions logged |

### Hardening Applied (Commit `10d83b9`)

| Gap | Fix Applied |
|-----|-------------|
| Analytics API missing region filter | Added `in('region', accessibleRegions)` for cases and DCAs |
| API key regeneration open to all | Added `dbUser.role !== 'SUPER_ADMIN'` check with 403 response |
| Users API no regional scope | Added `in('primary_region_id', accessibleRegions)` filter |
| UI showed regenerate to all | Conditional render: shows "🔒 Only SUPER_ADMIN" for others |

---

## 14. TEST USERS

| Email | Role | Assigned Regions |
|-------|------|------------------|
| `fedex.admin@fedex.com` | FEDEX_ADMIN | All regions (for testing) |
| `india.admin@fedex.com` | FEDEX_ADMIN | India only |
| `america.admin@fedex.com` | FEDEX_ADMIN | America only |

---

## 15. VALIDATION CHECKLIST

| Requirement | Verified |
|-------------|----------|
| All data is region-scoped | ✅ |
| Cannot access other regions | ✅ |
| Cannot create SUPER_ADMIN | ✅ |
| Cannot create DCA users | ✅ |
| Settings enforce boundaries | ✅ |
| Platform Governance hidden | ✅ |
| All actions audited | ✅ |
| Backend enforces all rules | ✅ |

---

## 16. REVISION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-03 | Initial FEDEX_ADMIN governance framework |
