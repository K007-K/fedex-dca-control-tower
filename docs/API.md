# FedEx DCA Control Tower - API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All API endpoints (except `/api/health`) require authentication via Supabase session cookies.

---

## Health Check

### GET /api/health
Check system health and database connectivity.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-12-27T00:00:00.000Z",
  "services": {
    "database": { "connected": true, "tablesExist": true },
    "supabase": { "url": "configured" }
  },
  "stats": {
    "organizations": 6,
    "dcas": 5,
    "users": 9,
    "cases": 25
  }
}
```

---

## Cases API

### GET /api/cases
List cases with pagination and filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number (default: 1) |
| limit | integer | Items per page (default: 20) |
| status | string | Filter by status |
| priority | string | Filter by priority |
| dca_id | uuid | Filter by assigned DCA |
| search | string | Search by case number or customer name |

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### POST /api/cases
Create a new case.

**Body:**
```json
{
  "invoice_number": "INV-001",
  "invoice_date": "2024-01-15",
  "due_date": "2024-02-15",
  "original_amount": 5000.00,
  "outstanding_amount": 5000.00,
  "customer_id": "CUST-001",
  "customer_name": "Acme Corp",
  "priority": "MEDIUM"
}
```

### GET /api/cases/:id
Get case details with timeline.

### PATCH /api/cases/:id
Update case.

### DELETE /api/cases/:id
Soft delete case.

---

## DCAs API

### GET /api/dcas
List all DCAs.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (ACTIVE, SUSPENDED, etc.) |

### POST /api/dcas
Create a new DCA.

**Body:**
```json
{
  "name": "Recovery Solutions Inc",
  "legal_name": "Recovery Solutions Inc.",
  "registration_number": "DCA-12345",
  "capacity_limit": 500,
  "primary_contact_name": "John Doe",
  "primary_contact_email": "john@recovery.com"
}
```

### GET /api/dcas/:id
Get DCA details with performance stats.

### PATCH /api/dcas/:id
Update DCA.

---

## Users API

### GET /api/users
List users with pagination and filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number (default: 1) |
| limit | integer | Items per page (default: 20) |
| role | string | Filter by role |
| dca_id | uuid | Filter by DCA |
| organization_id | uuid | Filter by organization |
| is_active | boolean | Filter by active status |
| search | string | Search by name or email |

### POST /api/users
Create a new user.

**Body:**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "FEDEX_ANALYST",
  "organization_id": "uuid",
  "timezone": "America/New_York"
}
```

### GET /api/users/:id
Get user details.

### PATCH /api/users/:id
Update user.

### DELETE /api/users/:id
Deactivate user (soft delete).

---

## SLA API

### GET /api/sla
List SLA templates.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Filter by SLA type |
| is_active | boolean | Filter by active status |

### POST /api/sla
Create SLA template.

**Body:**
```json
{
  "name": "First Contact SLA",
  "sla_type": "FIRST_CONTACT",
  "duration_hours": 24,
  "business_hours_only": true,
  "auto_escalate_on_breach": true
}
```

**SLA Types:**
- FIRST_CONTACT
- WEEKLY_UPDATE
- MONTHLY_REPORT
- RESPONSE_TO_DISPUTE
- RECOVERY_TARGET
- DOCUMENTATION_SUBMISSION

### GET /api/sla/:id
Get SLA template details with stats.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| include_logs | boolean | Include SLA logs |

### PATCH /api/sla/:id
Update SLA template.

### DELETE /api/sla/:id
Deactivate SLA template.

---

## Notifications API

### GET /api/notifications
List notifications.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| recipient_id | uuid | Filter by recipient |
| is_read | boolean | Filter by read status |
| type | string | Filter by notification type |
| priority | string | Filter by priority |
| limit | integer | Max results (default: 50) |

**Notification Types:**
- SLA_WARNING
- SLA_BREACH
- CASE_ASSIGNED
- PAYMENT_RECEIVED
- ESCALATION_CREATED
- DISPUTE_RAISED
- PERFORMANCE_ALERT
- SYSTEM_ALERT

### POST /api/notifications
Create a notification.

**Body:**
```json
{
  "recipient_id": "uuid",
  "notification_type": "CASE_ASSIGNED",
  "title": "New Case Assigned",
  "message": "Case #10001 has been assigned to you",
  "action_url": "/cases/uuid",
  "priority": "NORMAL",
  "channels": ["IN_APP", "EMAIL"]
}
```

### PATCH /api/notifications
Bulk mark as read.

**Body:**
```json
{
  "notification_ids": ["uuid1", "uuid2"]
}
```
or
```json
{
  "mark_all_read": true,
  "recipient_id": "uuid"
}
```

### GET /api/notifications/:id
Get notification details.

### PATCH /api/notifications/:id
Update notification (mark read/dismissed).

### DELETE /api/notifications/:id
Delete notification.

---

## Analytics API

### GET /api/analytics/dashboard
Get dashboard metrics.

**Response:**
```json
{
  "cases": {
    "total": 25,
    "byStatus": {...},
    "byPriority": {...}
  },
  "dcas": {
    "total": 5,
    "active": 5
  },
  "recovery": {
    "totalRecovered": 150000,
    "totalOutstanding": 250000,
    "recoveryRate": 37.5
  }
}
```

---

## User Roles

| Role | Description |
|------|-------------|
| SUPER_ADMIN | Full system access |
| FEDEX_ADMIN | FedEx administrator |
| FEDEX_MANAGER | FedEx manager |
| FEDEX_ANALYST | FedEx analyst (read + reports) |
| DCA_ADMIN | DCA administrator |
| DCA_MANAGER | DCA manager |
| DCA_AGENT | DCA collection agent |
| AUDITOR | Read-only + audit logs |
| READONLY | Read-only access |

---

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message",
  "details": "Optional details"
}
```

**HTTP Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error
