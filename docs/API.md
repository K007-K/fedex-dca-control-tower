# FedEx DCA Control Tower - API Reference

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### Authentication

#### POST /api/auth/login
Authenticate user and get tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": { "id": "...", "email": "...", "role": "FEDEX_ADMIN" },
  "accessToken": "eyJ...",
  "refreshToken": "..."
}
```

#### POST /api/auth/logout
Invalidate current session.

#### GET /api/auth/me
Get current authenticated user.

---

### Cases

#### GET /api/cases
List cases with filtering and pagination.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string[] | Filter by status |
| priority | string[] | Filter by priority |
| assignedDcaId | string | Filter by DCA |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 25) |
| sortBy | string | Sort field |
| sortOrder | 'asc' \| 'desc' | Sort direction |

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 1000,
    "totalPages": 40
  }
}
```

#### GET /api/cases/:id
Get case details.

#### POST /api/cases
Create new case.

#### PATCH /api/cases/:id
Update case.

#### POST /api/cases/allocate
Allocate case to DCA.

#### POST /api/cases/bulk
Bulk case operations.

---

### DCAs

#### GET /api/dcas
List all DCAs.

#### GET /api/dcas/:id
Get DCA details.

#### POST /api/dcas
Create new DCA.

#### PATCH /api/dcas/:id
Update DCA.

#### GET /api/dcas/:id/performance
Get DCA performance metrics.

---

### SLAs

#### GET /api/slas/templates
List SLA templates.

#### GET /api/slas/logs
Get SLA logs with breach information.

#### POST /api/slas/exempt
Exempt case from SLA.

---

### Analytics

#### GET /api/analytics/dashboard
Get dashboard metrics.

#### GET /api/analytics/recovery-trends
Get recovery trend data.

#### GET /api/analytics/dca-comparison
Compare DCA performance.

---

### AI (Proxy to Python Service)

#### POST /api/ai/score
Get AI-powered case scores.

#### POST /api/ai/predict
Get recovery probability prediction.

#### POST /api/ai/recommend
Get ROE recommendations.

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided",
    "details": [
      { "field": "email", "issue": "Required field" }
    ],
    "requestId": "req_abc123"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| INTERNAL_ERROR | 500 | Server error |
