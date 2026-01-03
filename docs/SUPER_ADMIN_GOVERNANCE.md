# SUPER_ADMIN Governance Framework

## Overview

The **SUPER_ADMIN** role is the platform owner with **global oversight** capabilities. This document defines exactly what SUPER_ADMIN can see, do, and control across all modules.

> **Key Principle:** SUPER_ADMIN is for governance and oversight, NOT day-to-day operations.

---

## 1. VISIBILITY

### What SUPER_ADMIN Can See

| Module | Visibility Level | Scope |
|--------|-----------------|-------|
| Dashboard | ✅ Full | All regions, all KPIs, aggregated data |
| Cases | ✅ Full | All cases across all regions and DCAs |
| DCAs | ✅ Full | All DCAs, performance metrics, compliance status |
| SLA | ✅ Full | All SLA templates, breaches, trends by region |
| Analytics | ✅ Full | Global analytics, cross-region comparisons |
| Reports | ✅ Full | All report types, scheduled reports |
| Notifications | ✅ Full | System alerts, SLA breaches, security events |
| Settings | ✅ Full | All settings including Platform Governance |
| Audit Logs | ✅ Full | Complete audit trail across all users |

### What SUPER_ADMIN Cannot See
- Individual case communication history (privacy)
- DCA internal notes (DCA operational details)
- Raw payment transaction data (handled by finance systems)

---

## 2. INSIGHTS

### Dashboard Cards for SUPER_ADMIN

#### Global KPI Cards
| Card | Description | Data Scope |
|------|-------------|------------|
| Total Outstanding | Sum of all outstanding amounts | All regions |
| Total Recovered | Sum of all recovered amounts | All regions |
| Recovery Rate | Overall platform recovery percentage | All regions |
| Active Cases | Total active cases count | All regions |
| SLA Compliance | Platform-wide SLA compliance rate | All regions |

#### AI Insights Panel
| Insight | Purpose |
|---------|---------|
| ML Service Health | Status of AI/ML prediction service |
| Model Accuracy | Current prediction accuracy metrics |
| Risk Distribution | High/Medium/Low priority case breakdown |
| Anomaly Detection | Unusual patterns flagged by AI |

#### System Context Cards
| Card | Description |
|------|-------------|
| System Health | Database, API, ML service status |
| Active Users | Currently logged-in users by role |
| Pending Actions | Cases awaiting allocation |
| Today's Activity | Cases created, closed, escalated today |

### Region Comparison Insights
- Recovery rates by region
- SLA compliance by region
- DCA performance rankings by region
- Outstanding amount heatmap

---

## 3. DASHBOARDS

### Main Dashboard (`/dashboard`)

**SUPER_ADMIN View:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Global KPIs (aggregated across all regions)                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ Total   │ │ Total   │ │ Recovery │ │ Active  │              │
│  │ Outstd. │ │ Recov.  │ │ Rate     │ │ Cases   │              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
├─────────────────────────────────────────────────────────────────┤
│  Region Filter: [All Regions ▼]                                 │
│                                                                 │
│  ┌─────────────────────────┐ ┌─────────────────────────┐       │
│  │ Recovery Trend Chart    │ │ Region Comparison Chart │       │
│  └─────────────────────────┘ └─────────────────────────┘       │
│                                                                 │
│  ┌─────────────────────────┐ ┌─────────────────────────┐       │
│  │ SLA Compliance Gauge    │ │ AI Insights Panel       │       │
│  └─────────────────────────┘ └─────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Analytics Dashboard (`/analytics`)

**SUPER_ADMIN Exclusive Features:**
- Cross-region comparison charts
- DCA performance rankings (all DCAs)
- Trend analysis across time periods
- Export capabilities for governance reports

---

## 4. CONTROLS

### What SUPER_ADMIN CAN Control

| Control | Description |
|---------|-------------|
| User Management | Create, edit, disable any user (except other SUPER_ADMINs) |
| Role Assignment | Assign/change roles for users |
| Region Access | Grant/revoke region access for users |
| DCA Onboarding | Approve/reject new DCA registrations |
| SLA Templates | Create/modify SLA templates |
| System Settings | Configure notification preferences, integrations |
| API Keys | Generate/revoke API keys |
| Feature Flags | View feature flag status |
| Audit Access | View complete audit history |

### What SUPER_ADMIN CANNOT Control (Governance Boundaries)

| Blocked Action | Reason |
|----------------|--------|
| ❌ Change Case Status | Operational action - for FEDEX_MANAGER/DCA |
| ❌ Assign Case to DCA | Operational action - for FEDEX_ADMIN/MANAGER |
| ❌ Add Case Notes | Operational action - for operational roles |
| ❌ Process Payments | Finance system integration |
| ❌ Delete Audit Logs | Compliance - immutable by design |
| ❌ Modify Own Role | Security - prevents privilege escalation |

---

## 5. SETTINGS GOVERNANCE

### Settings Module Access Matrix

| Settings Section | SUPER_ADMIN | FEDEX_ADMIN | DCA_ADMIN |
|------------------|-------------|-------------|-----------|
| Profile | ✅ Edit own | ✅ Edit own | ✅ Edit own |
| Users | ✅ Full CRUD | ✅ Limited | ⚠️ Own DCA only |
| Notifications | ✅ All preferences | ✅ Own prefs | ✅ Own prefs |
| Security | ✅ Full | ⚠️ View only | ❌ Hidden |
| Integrations | ✅ Full | ⚠️ View only | ❌ Hidden |
| **Platform Governance** | ✅ **Exclusive** | ❌ Hidden | ❌ Hidden |

### Platform Governance Section (`/settings/governance`)

**SUPER_ADMIN Exclusive Access:**

| Tab | Purpose | Actions |
|-----|---------|---------|
| 🌍 Regions | View/manage region configurations | Add, edit, deactivate regions |
| 🚩 Feature Flags | View enabled/disabled features | View only (DevOps configures) |
| 📋 Audit Log | Recent system events | View, filter, export |
| ⚙️ System Defaults | Default SLA, currencies, timezones | Configure defaults |

---

## 6. NOTIFICATION ROUTING

### Notifications SUPER_ADMIN Receives

| Type | Priority | Dismissible |
|------|----------|-------------|
| SLA_BREACH (systemic) | 🔴 Critical | ❌ No |
| SYSTEM_ALERT | 🔴 Critical | ❌ No |
| SECURITY_ALERT | 🔴 Critical | ❌ No |
| SERVICE_DEGRADATION | 🔴 Critical | ❌ No |
| SLA_WARNING (individual) | 🟡 Medium | ✅ Yes |
| CASE_ESCALATION | 🟡 Medium | ✅ Yes |
| Weekly Digest | 🟢 Low | ✅ Yes |

### Notifications SUPER_ADMIN Does NOT Receive

| Type | Reason |
|------|--------|
| CASE_ASSIGNED | Operational detail |
| PAYMENT_RECEIVED | Individual case level |
| DCA routine updates | Operational noise |

---

## 7. BACKEND ENFORCEMENT

All governance rules are enforced server-side:

### API-Level Checks
```typescript
// Example: Block operational actions for SUPER_ADMIN
if (action === 'ASSIGN_CASE' && isGovernanceRole(userRole)) {
    throw new ForbiddenError('Governance roles cannot assign cases');
}
```

### Database-Level Checks (RLS)
```sql
-- SUPER_ADMIN can view all cases (no region filter)
CREATE POLICY cases_super_admin ON cases
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
    );
```

### Audit Logging
All SUPER_ADMIN actions are logged:
```typescript
await auditLog.create({
    entity_type: 'SETTINGS',
    action: 'REGENERATE_API_KEY',
    performed_by: userId,
    performed_by_role: 'SUPER_ADMIN',
    // ... timestamp, IP, etc.
});
```

---

## 8. IMPLEMENTATION STATUS

| Feature | Status | Notes |
|---------|--------|-------|
| Global visibility | ✅ Implemented | All modules accessible |
| Hide operational controls | ✅ Implemented | BulkActionBar updated |
| Platform Governance page | ✅ Implemented | `/settings/governance` |
| Non-dismissible alerts | ✅ Implemented | Critical types flagged |
| Audit logging | ✅ Implemented | API key regeneration logged |
| Role display | ✅ Implemented | Shows actual role in UI |

---

## 9. TEST USERS

| Email | Role | Purpose |
|-------|------|---------|
| `super.admin@fedex.com` | SUPER_ADMIN | Platform governance testing |
| `fedex.admin@fedex.com` | FEDEX_ADMIN | Admin operations testing |
| `india.manager@fedex.com` | FEDEX_MANAGER | Regional manager testing |

---

## 10. REVISION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-03 | Initial governance framework |
