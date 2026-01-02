# FedEx DCA Control Tower - API Documentation

## Overview

This document describes the REST API endpoints available in the FedEx DCA Control Tower application.

**Base URL:** `http://localhost:3000/api` (development) or `https://your-domain.com/api` (production)

---

## Authentication

### Session Authentication (Web App)
The web application uses cookie-based session authentication via Supabase Auth.

### API Key Authentication (External Integrations)
For external systems, use API key authentication:

```http
Authorization: Bearer fedex_prod_<your_api_key>
```

Generate API keys from: **Settings → Integrations → API Keys**

---

## Public API (v1)

### List Cases

```http
GET /api/v1/cases
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Max results (default: 50, max: 100) |
| offset | number | Pagination offset (default: 0) |
| status | string | Filter by status (PENDING_ALLOCATION, ALLOCATED, etc.) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "case_number": "CASE-2025-123456",
      "status": "ALLOCATED",
      "priority": "MEDIUM",
      "customer_name": "Acme Corp",
      "outstanding_amount": 15000.00,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### Get Single Case

```http
GET /api/v1/cases/{id}
```

### Analytics Summary

```http
GET /api/v1/analytics
```

---

## Internal API Endpoints

### Cases
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/cases | List cases with filters |
| POST | /api/cases | Create new case |
| GET | /api/cases/{id} | Get case details |
| PATCH | /api/cases/{id} | Update case |
| DELETE | /api/cases/{id} | Delete case |
| POST | /api/cases/bulk | Bulk operations |

### DCAs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dcas | List DCAs |
| POST | /api/dcas | Create DCA |
| GET | /api/dcas/{id} | Get DCA details |
| PATCH | /api/dcas/{id} | Update DCA |
| DELETE | /api/dcas/{id} | Terminate DCA |

### SLA
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/sla/templates | List SLA templates |
| POST | /api/sla/templates | Create template |
| GET | /api/sla/breach-alerts | Get breach alerts |

### Escalations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/escalations | List escalations |
| POST | /api/escalations | Create escalation |
| PATCH | /api/escalations/{id} | Resolve escalation |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | List users |
| POST | /api/users | Create user |
| GET | /api/users/me | Get current user |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | List notifications |
| PATCH | /api/notifications/{id}/read | Mark as read |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/webhooks | List webhooks |
| POST | /api/webhooks | Create webhook |
| DELETE | /api/webhooks/{id} | Delete webhook |

### Audit Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/audit-logs | List audit logs (admin only) |

---

## Error Responses

```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired API key"
}
```

**Status Codes:**
| Status | Description |
|--------|-------------|
| 400 | Invalid request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 429 | Rate limited |
| 500 | Server error |

---

## Rate Limits

- API Key: 100 requests/minute
- Authenticated: 60 requests/minute
- Unauthenticated: 10 requests/minute

---

## Webhooks

**Supported Events:**
- `case.created`, `case.updated`, `case.escalated`, `case.closed`
- `payment.received`

---

*Last updated: January 2, 2026*
