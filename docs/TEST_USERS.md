# FedEx DCA Control Tower - Test Users & Setup

> **Password for ALL users:** `Password123!`

---

## 🚀 Quick Setup (Run in Supabase SQL Editor)

### Step 1: Run the Complete Seed Script
Copy and run `scripts/complete-seed.sql` in Supabase SQL Editor.

### Step 2: Create Auth Users in Supabase Dashboard
Go to **Authentication** → **Users** → **Add user** for each:

| Email | Password |
|-------|----------|
| `system.admin@fedex.com` | `Password123!` |
| `agent1@tatarecovery.in` | `Password123!` |

### Step 3: Link Auth Users to Public Users
After creating auth users, run:

```sql
-- Link auth.users to public.users
INSERT INTO public.users (id, email, full_name, role, is_active, dca_id, primary_region_id)
SELECT 
    au.id, 
    au.email, 
    'System Admin',
    'SUPER_ADMIN',
    true,
    NULL,
    (SELECT id FROM regions WHERE region_code = 'INDIA' LIMIT 1)
FROM auth.users au 
WHERE au.email = 'system.admin@fedex.com'
ON CONFLICT (id) DO UPDATE SET role = 'SUPER_ADMIN';

INSERT INTO public.users (id, email, full_name, role, is_active, dca_id, primary_region_id)
SELECT 
    au.id, 
    au.email, 
    'Tata Agent 1',
    'DCA_AGENT',
    true,
    (SELECT id FROM dcas WHERE name = 'Tata Recovery Services' LIMIT 1),
    (SELECT id FROM regions WHERE region_code = 'INDIA' LIMIT 1)
FROM auth.users au 
WHERE au.email = 'agent1@tatarecovery.in'
ON CONFLICT (id) DO UPDATE SET 
    role = 'DCA_AGENT',
    dca_id = (SELECT id FROM dcas WHERE name = 'Tata Recovery Services' LIMIT 1);
```

---

## 👤 FedEx Users

| Email | Role | Region | Access |
|-------|------|--------|--------|
| `system.admin@fedex.com` | SUPER_ADMIN | Global | Full system access |
| `india.admin@fedex.com` | FEDEX_ADMIN | INDIA | Regional admin |
| `mumbai.manager@fedex.com` | FEDEX_MANAGER | INDIA | Regional operations |

---

## 🏢 Tata Recovery Services (DCA)

| Email | Role | State | Notes |
|-------|------|-------|-------|
| `rajesh.sharma@tatarecovery.in` | DCA_ADMIN | All | DCA owner |
| `manager@tatarecovery.in` | DCA_MANAGER | MH | Maharashtra manager |
| `when ` | DCA_AGENT | MH | Collection agent |
| `agent2@tatarecovery.in` | DCA_AGENT | MH | Collection agent |

---

## 🏢 InfoSol Collections (DCA)

| Email | Role | State | Notes |
|-------|------|-------|-------|
| `admin@infosolcollections.in` | DCA_ADMIN | All | DCA owner |
| `manager@infosolcollections.in` | DCA_MANAGER | DL | Delhi manager |
| `agent1@infosolcollections.in` | DCA_AGENT | DL | Collection agent |
| `agent2@infosolcollections.in` | DCA_AGENT | DL | Collection agent |

---

## 🏭 DCAs Summary

| DCA | States | Capacity | Commission |
|-----|--------|----------|------------|
| Tata Recovery Services | MH, KA, TN | 500 | 15% |
| InfoSol Collections | DL, UP | 300 | 12% |

---

## 🔑 Quick Login Reference

```
# SUPER_ADMIN (Full access)
Email: system.admin@fedex.com
Pass:  Password123!

# DCA_AGENT (Agent workbench)
Email: agent1@tatarecovery.in
Pass:  Password123!
```

---

## ✅ Verification Queries

```sql
-- Check DCAs exist
SELECT id, name, status FROM dcas;

-- Check users with roles
SELECT email, role, dca_id FROM users;

-- Check region assignments
SELECT r.region_code, d.name as dca_name 
FROM region_dca_assignments rda
JOIN regions r ON r.id = rda.region_id
JOIN dcas d ON d.id = rda.dca_id;
```

---

*Last Updated: 2026-01-07*
