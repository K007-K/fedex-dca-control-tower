# FedEx DCA Control Tower - Test Users

> **Password for ALL users:** `Password123!`

---

## FedEx Users (3)

| Email | Role | Region | Notes |
|-------|------|--------|-------|
| `system.admin@fedex.com` | SUPER_ADMIN | Global | Full system access |
| `india.admin@fedex.com` | FEDEX_ADMIN | INDIA | Regional admin |
| `mumbai.manager@fedex.com` | FEDEX_MANAGER | INDIA | Regional operations |

---

## Tata Recovery Services (4)

| Email | Role | State | Notes |
|-------|------|-------|-------|
| `rajesh.sharma@tatarecovery.in` | DCA_ADMIN | - | DCA owner, all states |
| `manager@tatarecovery.in` | DCA_MANAGER | MH | Maharashtra manager |
| `agent1@tatarecovery.in` | DCA_AGENT | MH | Created by manager |
| `agent2@tatarecovery.in` | DCA_AGENT | MH | Created by manager |

---

## InfoSol Collections (4)

| Email | Role | State | Notes |
|-------|------|-------|-------|
| `admin@infosolcollections.in` | DCA_ADMIN | - | DCA owner, all states |
| `manager@infosolcollections.in` | DCA_MANAGER | DL | Delhi manager |
| `agent1@infosolcollections.in` | DCA_AGENT | DL | Created by manager |
| `agent2@infosolcollections.in` | DCA_AGENT | DL | Created by manager |

---

## DCAs Created

| DCA | Registration | States | Contract | License |
|-----|-------------|--------|----------|---------|
| Tata Recovery Services | U74999MH2020PTC123456 | MH, KA, TN | 2025-01-01 to 2027-12-31 | Valid till 2027-12-31 |
| InfoSol Collections | U74999DL2019PTC987654 | DL, UP | 2025-01-01 to 2027-06-30 | Valid till 2027-06-30 |

---

## Quick Login Reference

```
# SUPER_ADMIN (God mode)
Email: system.admin@fedex.com
Pass:  Password123!

# DCA_AGENT (Collection work)
Email: agent1@tatarecovery.in
Pass:  Password123!
```

---

## Verification Queries

Run in Supabase SQL Editor to verify:

```sql
-- Check users count by role
SELECT role, COUNT(*) FROM users GROUP BY role ORDER BY role;

-- Check old users are gone (should return 0 for old emails)
SELECT COUNT(*) FROM users WHERE email LIKE '%demo%' OR email LIKE '%test%';

-- Verify 11 total users
SELECT COUNT(*) FROM users;
```

---

*Last Updated: 2026-01-06*
