# FedEx DCA Control Tower - Governance Architecture

> Complete guide to system hierarchy, DCA creation, user management, and access control.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Entities](#core-entities)
   - [Regions](#1-regions)
   - [DCAs](#2-dcas-debt-collection-agencies)
   - [Region-DCA Assignments](#3-region-dca-assignments)
3. [User Roles Hierarchy](#user-roles-hierarchy)
4. [Entity Creation Flows](#entity-creation-flows)
   - [Region Creation](#step-1-create-a-region)
   - [DCA Creation](#step-2-create-a-dca)
   - [User Creation](#step-3-6-create-users)
5. [Access Control & RLS](#access-control--rls)
6. [State-Scoped Governance](#state-scoped-governance)
7. [Example Scenario](#complete-example-scenario)

---

## System Overview

**FedEx DCA Control Tower** is a debt collection management system where:

| Term | Description |
|------|-------------|
| **FedEx** | The company that outsources debt collection |
| **DCA** | Debt Collection Agency - external partner companies |
| **Control Tower** | Central management system to oversee all DCAs and cases |
| **Region** | Geographic governance boundary (e.g., INDIA, AMERICAS) |
| **Case** | Individual debt to be collected |

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FedEx Control Tower                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    REGIONS                           │   │
│  │   ┌─────────┐   ┌─────────┐   ┌─────────┐          │   │
│  │   │  INDIA  │   │AMERICAS │   │  EMEA   │          │   │
│  │   └────┬────┘   └────┬────┘   └────┬────┘          │   │
│  └────────┼─────────────┼─────────────┼────────────────┘   │
│           │             │             │                     │
│   ┌───────▼───────┐     │             │                     │
│   │     DCAs      │     │             │                     │
│   │  ┌─────────┐  │     │             │                     │
│   │  │  Tata   │  │     │             │                     │
│   │  │Recovery │  │     │             │                     │
│   │  └─────────┘  │     │             │                     │
│   │  ┌─────────┐  │     │             │                     │
│   │  │InfoSol  │  │     │             │                     │
│   │  │Collect. │  │     │             │                     │
│   │  └─────────┘  │     │             │                     │
│   └───────────────┘     │             │                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Entities

### 1. Regions

**What:** Geographic boundaries for governance.

**Table: `regions`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `region_code` | VARCHAR | 'INDIA', 'AMERICAS', 'EMEA' |
| `name` | VARCHAR | Human-readable name |
| `country_codes` | TEXT[] | Array of ISO country codes |
| `state_codes` | TEXT[] | Array of state/province codes |
| `default_currency` | VARCHAR | 'INR', 'USD', 'EUR' |
| `timezone` | VARCHAR | 'Asia/Kolkata', 'America/New_York' |
| `status` | ENUM | 'ACTIVE', 'INACTIVE' |

**Example:**
```sql
INSERT INTO regions (region_code, name, country_codes, state_codes, default_currency, timezone)
VALUES (
    'INDIA', 
    'India', 
    ARRAY['IN'], 
    ARRAY['MH', 'KA', 'TN', 'DL', 'UP', 'GJ', 'RJ', 'WB', 'AP', 'TS'], 
    'INR', 
    'Asia/Kolkata'
);
```

**Why Regions Matter:**
- All SLAs, escalations, and rules are region-specific
- Users can only access data within their assigned regions
- Cases are automatically assigned to regions based on customer location

---

### 2. DCAs (Debt Collection Agencies)

**What:** External partner companies that collect debts on behalf of FedEx.

**Table: `dcas`**

| Column | Type | Description |
|--------|------|-------------|
| **Basic Info** | | |
| `id` | UUID | Primary key |
| `name` | VARCHAR | Display name |
| `legal_name` | VARCHAR | Registered company name |
| `registration_number` | VARCHAR | Company registration number |
| `status` | ENUM | 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_APPROVAL' |
| **Performance** | | |
| `performance_score` | DECIMAL | 0-100 score |
| `recovery_rate` | DECIMAL | % of debt recovered |
| `sla_compliance_rate` | DECIMAL | % SLA compliance |
| `total_cases_handled` | INT | Lifetime cases |
| `total_amount_recovered` | DECIMAL | Lifetime recovery |
| **Capacity** | | |
| `capacity_limit` | INT | Max cases they can handle |
| `capacity_used` | INT | Current assigned cases |
| `max_case_value` | DECIMAL | Max debt value per case |
| `min_case_value` | DECIMAL | Min debt value per case |
| **Coverage** | | |
| `region_id` | UUID | FK to regions |
| `geographic_coverage` | JSONB | `{"states": ["MH", "KA", "TN"]}` |
| `specializations` | JSONB | Types of debts they handle |
| **Compliance** | | |
| `certifications` | JSONB | Industry certifications |
| `license_expiry` | DATE | **License valid until** |
| `insurance_valid_until` | DATE | Insurance coverage end date |
| `last_audit_date` | DATE | Last compliance audit |
| `audit_score` | DECIMAL | Audit result score |
| **Contract** | | |
| `contract_start_date` | DATE | **Contract start** |
| `contract_end_date` | DATE | **Contract end** |
| `commission_rate` | DECIMAL | % of recovered amount |
| **Contact** | | |
| `primary_contact_name` | VARCHAR | Admin name |
| `primary_contact_email` | VARCHAR | Admin email |
| `primary_contact_phone` | VARCHAR | Admin phone |

**Example:**
```sql
INSERT INTO dcas (
    -- Basic Info
    name, legal_name, registration_number, status,
    -- Coverage
    region_id, geographic_coverage,
    -- Capacity
    capacity_limit,
    -- Compliance
    license_expiry,
    -- Contract
    contract_start_date, contract_end_date, commission_rate,
    -- Contact
    primary_contact_name, primary_contact_email, primary_contact_phone
)
VALUES (
    -- Basic Info
    'Tata Recovery Services',
    'Tata Recovery Services Pvt Ltd',
    'U74999MH2020PTC123456',  -- Registration number
    'ACTIVE',
    -- Coverage
    '<INDIA_REGION_ID>',
    '{"states": ["MH", "KA", "TN"]}',
    -- Capacity
    500,
    -- Compliance
    '2027-12-31',  -- License valid until
    -- Contract
    '2025-01-01',  -- Contract start
    '2027-12-31',  -- Contract end
    15.00,         -- 15% commission
    -- Contact
    'Rajesh Sharma',
    'admin@tatarecovery.in',
    '+91-22-12345678'
);
```

**Constraints:**
- DCA can only operate in states defined in `geographic_coverage`
- DCA must be linked to a region via `region_dca_assignments`
- Contract and license dates are tracked for compliance

---

### 3. Region-DCA Assignments

**What:** Links DCAs to Regions (many-to-many relationship).

**Table: `region_dca_assignments`**

| Column | Type | Description |
|--------|------|-------------|
| `region_id` | UUID | FK to regions |
| `dca_id` | UUID | FK to dcas |
| `is_primary` | BOOLEAN | Primary DCA for this region? |
| `allocation_priority` | INT | 1 = highest priority |
| `is_active` | BOOLEAN | Currently accepting cases? |

**Example:**
```sql
INSERT INTO region_dca_assignments (region_id, dca_id, is_primary, allocation_priority, is_active)
VALUES 
    ('<INDIA_ID>', '<TATA_ID>', true, 1, true),
    ('<INDIA_ID>', '<INFOSOL_ID>', false, 2, true);
```

**Case Allocation Logic:**
1. Incoming case → Determine region from customer address
2. Find active DCAs for that region ordered by `allocation_priority`
3. Check DCA capacity (`capacity_used < capacity_limit`)
4. Assign to first DCA with available capacity

---

## User Roles Hierarchy

```
                    ┌─────────────────┐
                    │   SUPER_ADMIN   │  ← God mode, full access
                    │   (FedEx HQ)    │
                    └────────┬────────┘
                             │ Can create: ALL FedEx roles + DCA_ADMIN
           ┌─────────────────┼─────────────────┐
           ▼                 ▼                 ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │ FEDEX_ADMIN │   │ FEDEX_ADMIN │   │ FEDEX_ADMIN │
    │   (INDIA)   │   │  (AMERICAS) │   │   (EMEA)    │
    └──────┬──────┘   └─────────────┘   └─────────────┘
           │ Can create: FedEx roles (except SUPER_ADMIN) + DCA_ADMIN
    ┌──────┴──────┐
    ▼             ▼
┌──────────┐  ┌──────────┐
│FEDEX_MGR │  │ DCA_ADMIN│ ← Owns a DCA
│ (Mumbai) │  │  (Tata)  │
└──────────┘  └────┬─────┘
                   │ Can create: DCA_MANAGER + DCA_AGENT
            ┌──────┴──────┐
            ▼             ▼
      ┌──────────┐  ┌──────────┐
      │DCA_MANAGER│  │DCA_MANAGER│ ← Manages agents in ONE state
      │   (MH)   │  │   (KA)   │
      └────┬─────┘  └──────────┘
           │ Can create: DCA_AGENT (in same state)
    ┌──────┴──────┐
    ▼             ▼
┌──────────┐  ┌──────────┐
│DCA_AGENT │  │DCA_AGENT │ ← Does actual collection work
│ (Agent1) │  │ (Agent2) │
└──────────┘  └──────────┘
```

### Role Definitions

| Role | Who | Scope | Can Create | Restrictions |
|------|-----|-------|------------|--------------|
| **SUPER_ADMIN** | FedEx HQ IT | Global | ALL FedEx roles + DCA_ADMIN | None |
| **FEDEX_ADMIN** | Regional FedEx Lead | One region | FEDEX_ADMIN, FEDEX_MANAGER, FEDEX_ANALYST, DCA_ADMIN | **Cannot create/edit SUPER_ADMIN** |
| **FEDEX_MANAGER** | FedEx Regional Ops | One region | None | View/manage escalations only |
| **FEDEX_ANALYST** | Analytics team | One region | None | Read-only analytics |
| **DCA_ADMIN** | DCA Owner/CEO | One DCA | DCA_MANAGER, DCA_AGENT | **Cannot create FedEx roles** |
| **DCA_MANAGER** | DCA State Lead | One DCA + One State | DCA_AGENT (in same state) | State-scoped |
| **DCA_AGENT** | Collection Agent | One DCA + One State | None | Assigned cases only |
| **AUDITOR** | Compliance | Global read-only | None | View all, modify none |

### Key Governance Rules

> [!IMPORTANT]
> **SUPER_ADMIN vs FEDEX_ADMIN Creation Authority**
> - **SUPER_ADMIN** can create ALL roles including other SUPER_ADMINs
> - **FEDEX_ADMIN** can create the same roles as SUPER_ADMIN **EXCEPT** SUPER_ADMIN
> - Both can create DCA_ADMIN and explicitly assign their regions
> - Neither creates DCA_MANAGER or DCA_AGENT directly (that's DCA_ADMIN's job)

### Users Table Structure

**Table: `users`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Same as auth.users.id |
| `email` | VARCHAR | Login email |
| `full_name` | VARCHAR | Display name |
| `role` | ENUM | User role |
| `is_active` | BOOLEAN | Can login? |
| `primary_region_id` | UUID | FK to regions (FedEx users) |
| `dca_id` | UUID | FK to dcas (DCA users only) |
| `state_code` | VARCHAR(2) | 'MH', 'DL' (DCA_MANAGER/AGENT) |
| `can_create_agents` | BOOLEAN | Manager privilege |
| `created_by_user_id` | UUID | Traceability |
| `created_at` | TIMESTAMPTZ | When created |

---

## Entity Creation Flows

### Step 1: Create a Region

**Who can do this:** SUPER_ADMIN only

```sql
INSERT INTO regions (region_code, name, country_codes, state_codes, default_currency, timezone, status)
VALUES (
    'INDIA', 
    'India', 
    ARRAY['IN'], 
    ARRAY['MH', 'KA', 'TN', 'DL', 'UP', 'GJ', 'RJ', 'WB', 'AP', 'TS'], 
    'INR', 
    'Asia/Kolkata',
    'ACTIVE'
);
```

---

### Step 2: Create a DCA

**Who can do this:** SUPER_ADMIN, FEDEX_ADMIN

```sql
-- 1. Create the DCA entity
INSERT INTO dcas (
    name, legal_name, status, region_id, 
    capacity_limit, commission_rate, 
    geographic_coverage,
    primary_contact_email, primary_contact_phone, primary_contact_name
)
VALUES (
    'Tata Recovery Services',
    'Tata Recovery Services Pvt Ltd',
    'ACTIVE',
    '<INDIA_REGION_ID>',
    500,
    15.00,
    '{"states": ["MH", "KA", "TN"], "city": "Mumbai", "country": "India"}',
    'admin@tatarecovery.in',
    '+91-22-12345678',
    'Rajesh Sharma'
);

-- 2. Link DCA to Region
INSERT INTO region_dca_assignments (
    region_id, dca_id, is_primary, allocation_priority, is_active
)
VALUES (
    '<INDIA_REGION_ID>', 
    '<TATA_DCA_ID>', 
    true,   -- Primary for this region
    1,      -- Highest priority
    true    -- Active
);
```

---

### Step 3: Create FEDEX_ADMIN

**Who can do this:** SUPER_ADMIN only

```sql
-- 1. Create auth user (Supabase handles password hashing)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
    '<UUID>',
    'india.admin@fedex.com',
    '<HASHED_PASSWORD>',
    NOW(),
    '{"full_name": "India Admin"}'
);

-- 2. Create user profile
INSERT INTO users (id, email, full_name, role, is_active, primary_region_id)
VALUES (
    '<UUID>',
    'india.admin@fedex.com',
    'India Admin',
    'FEDEX_ADMIN',
    true,
    '<INDIA_REGION_ID>'
);

-- 3. Grant region access
INSERT INTO user_region_access (user_id, region_id, access_level, is_primary_region)
VALUES ('<UUID>', '<INDIA_REGION_ID>', 'ADMIN', true);
```

---

### Step 4: Create DCA_ADMIN

**Who can do this:** SUPER_ADMIN, FEDEX_ADMIN (of same region)

```sql
-- 1. Create auth user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
    '<UUID>',
    'rajesh.sharma@tatarecovery.in',
    '<HASHED_PASSWORD>',
    NOW(),
    '{"full_name": "Rajesh Sharma"}'
);

-- 2. Create user profile linked to DCA
INSERT INTO users (id, email, full_name, role, is_active, dca_id, primary_region_id)
VALUES (
    '<UUID>',
    'rajesh.sharma@tatarecovery.in',
    'Rajesh Sharma',
    'DCA_ADMIN',
    true,
    '<TATA_DCA_ID>',      -- Linked to DCA
    '<INDIA_REGION_ID>'    -- Inherits region from DCA
);
```

> **Note:** DCA_ADMIN does NOT have a `state_code` - they can manage all states within their DCA's `geographic_coverage`.

---

### Step 5: Create DCA_MANAGER

**Who can do this:** DCA_ADMIN (of same DCA)

```sql
INSERT INTO users (
    id, email, full_name, role, is_active, 
    dca_id, primary_region_id, 
    state_code, can_create_agents
)
VALUES (
    '<UUID>',
    'manager@tatarecovery.in',
    'Tata Manager',
    'DCA_MANAGER',
    true,
    '<TATA_DCA_ID>',       -- Same DCA as creator
    '<INDIA_REGION_ID>',   -- Same region
    'MH',                  -- REQUIRED: Scoped to Maharashtra
    true                   -- Can create agents
);
```

> **Validation:** `state_code` MUST be in the DCA's `geographic_coverage.states` array.

---

### Step 6: Create DCA_AGENT

**Who can do this:** DCA_ADMIN or DCA_MANAGER (of same DCA)

```sql
INSERT INTO users (
    id, email, full_name, role, is_active, 
    dca_id, primary_region_id, 
    state_code, created_by_user_id
)
VALUES (
    '<UUID>',
    'agent1@tatarecovery.in',
    'Tata Agent 1',
    'DCA_AGENT',
    true,
    '<TATA_DCA_ID>',        -- Same DCA
    '<INDIA_REGION_ID>',    -- Same region
    'MH',                   -- INHERITED from creator (if DCA_MANAGER)
    '<MANAGER_USER_ID>'     -- Traceability
);
```

> **Auto-inheritance when created by DCA_MANAGER:**
> - `dca_id` → from manager
> - `primary_region_id` → from DCA
> - `state_code` → from manager's `state_code`
> - `created_by_user_id` → manager's ID

---

## Access Control & RLS

### Role-Based Data Access

| Role | Sees Cases From |
|------|----------------|
| SUPER_ADMIN | ALL regions, ALL DCAs, ALL cases |
| FEDEX_ADMIN | Their region only |
| FEDEX_MANAGER | Their region only |
| DCA_ADMIN | Their DCA only |
| DCA_MANAGER | Their DCA + Their state only |
| DCA_AGENT | Their assigned cases only |

### Row Level Security Policies

```sql
-- Policy: DCA users can only see cases assigned to their DCA
CREATE POLICY "dca_users_see_own_dca_cases" ON cases
FOR SELECT
USING (
    assigned_dca_id = (SELECT dca_id FROM users WHERE id = auth.uid())
);

-- Policy: DCA_MANAGER can only see cases in their state
CREATE POLICY "dca_manager_state_filter" ON cases
FOR SELECT
USING (
    -- Either no state filter (DCA_ADMIN) or state matches
    (SELECT state_code FROM users WHERE id = auth.uid()) IS NULL
    OR customer_state = (SELECT state_code FROM users WHERE id = auth.uid())
);
```

---

## State-Scoped Governance

### Why State Scoping?

India has diverse regulations and collection practices by state. State scoping ensures:

1. **Regulatory Compliance** - Different states have different debt collection laws
2. **Operational Efficiency** - Managers focus on their geographic area
3. **Language & Culture** - Local managers understand local customers
4. **Traceability** - Know who created which agent for auditing

### State Inheritance Flow

```
DCA_ADMIN (no state_code - manages entire DCA)
    │
    ├─► Creates DCA_MANAGER with state_code = 'MH'
    │       │
    │       └─► DCA_MANAGER creates DCA_AGENT
    │               │
    │               └─► Agent INHERITS state_code = 'MH'
    │                   Agent INHERITS dca_id from manager
    │                   created_by_user_id = manager's ID
    │
    └─► Creates DCA_MANAGER with state_code = 'KA'
            │
            └─► DCA_MANAGER creates DCA_AGENT
                    │
                    └─► Agent INHERITS state_code = 'KA'
```

---

## Complete Example Scenario

### Scenario: Setting Up India Operations

```
Step 1: SUPER_ADMIN creates INDIA region
    ↓
Step 2: SUPER_ADMIN creates FEDEX_ADMIN for INDIA
        - Email: india.admin@fedex.com
        - Region: INDIA
    ↓
Step 3: FEDEX_ADMIN creates DCA "Tata Recovery Services"
        - Coverage: MH, KA, TN states
        - Capacity: 500 cases
        - Commission: 15%
    ↓
Step 4: FEDEX_ADMIN creates DCA_ADMIN for Tata
        - Email: rajesh.sharma@tatarecovery.in
        - DCA: Tata Recovery
    ↓
Step 5: DCA_ADMIN (Rajesh) creates DCA_MANAGER for Maharashtra
        - Email: manager@tatarecovery.in
        - State: MH
        - can_create_agents: true
    ↓
Step 6: DCA_MANAGER creates DCA_AGENT
        - Email: agent1@tatarecovery.in
        - State: MH (inherited from manager)
        - created_by: manager's ID
```

### Resulting Data

**regions:**
| region_code | name | state_codes |
|-------------|------|-------------|
| INDIA | India | MH, KA, TN, DL, UP, ... |

**dcas:**
| name | status | capacity | states |
|------|--------|----------|--------|
| Tata Recovery Services | ACTIVE | 500 | MH, KA, TN |
| InfoSol Collections | ACTIVE | 300 | DL, UP |

**users:**
| email | role | dca | state | created_by |
|-------|------|-----|-------|------------|
| system.admin@fedex.com | SUPER_ADMIN | - | - | System |
| india.admin@fedex.com | FEDEX_ADMIN | - | - | SUPER_ADMIN |
| rajesh.sharma@tatarecovery.in | DCA_ADMIN | Tata | - | FEDEX_ADMIN |
| manager@tatarecovery.in | DCA_MANAGER | Tata | MH | DCA_ADMIN |
| agent1@tatarecovery.in | DCA_AGENT | Tata | MH | DCA_MANAGER |
| agent2@tatarecovery.in | DCA_AGENT | Tata | MH | DCA_MANAGER |

---

## Summary

### Key Principles

1. **Governance Hierarchy** - Each level can only manage below their scope
2. **State Scoping** - DCA operations are partitioned by state
3. **Traceability** - `created_by_user_id` tracks who created each user
4. **RLS Enforcement** - Database-level access control
5. **Capacity Management** - DCAs have case limits
6. **Regional Isolation** - Cross-region access is prohibited
7. **Contract Compliance** - DCA license and contract dates are tracked

### Creation Authority Matrix

| Role | Can Create | Cannot Create |
|------|------------|---------------|
| **SUPER_ADMIN** | Regions, DCAs, ALL FedEx roles, DCA_ADMIN | - |
| **FEDEX_ADMIN** | DCAs, FEDEX_ADMIN, FEDEX_MANAGER, FEDEX_ANALYST, DCA_ADMIN | **SUPER_ADMIN** |
| **DCA_ADMIN** | DCA_MANAGER (with state), DCA_AGENT | Any FedEx roles |
| **DCA_MANAGER** | DCA_AGENT (inherits state) | Any other roles |
| **DCA_AGENT** | None | All roles |

### Region Assignment Rules

| When Creating | Who Assigns Region | How |
|---------------|-------------------|-----|
| **FEDEX_ADMIN** | SUPER_ADMIN | Explicitly selects region |
| **FEDEX_MANAGER** | SUPER_ADMIN or FEDEX_ADMIN | Explicitly selects region |
| **DCA_ADMIN** | SUPER_ADMIN or FEDEX_ADMIN | Explicitly assigns to DCA's region |
| **DCA_MANAGER** | DCA_ADMIN | Inherits from DCA |
| **DCA_AGENT** | DCA_ADMIN or DCA_MANAGER | Inherits from DCA |

### DCA Compliance Fields

| Field | Purpose | Action on Expiry |
|-------|---------|------------------|
| `registration_number` | Company registration | Verification required |
| `license_expiry` | Operating license validity | DCA suspended if expired |
| `contract_start_date` | Contract term start | - |
| `contract_end_date` | Contract term end | DCA suspended if expired |
| `insurance_valid_until` | Insurance coverage | Alert before expiry |

---

*Last Updated: 2026-01-06*

