# FedEx DCA Control Tower - Improvements Tracker

## ✅ Recently Fixed (Phase 5-8 + Sprint 1)

| # | Issue | Phase | Status | Notes |
|---|-------|-------|--------|-------|
| 1 | OAuth users can't see cases data | 5 | ✅ Fixed | Switched to email/password auth |
| 2 | Case forms not implemented | 5 | ✅ Fixed | Created CRUD forms |
| 3 | Case detail 404 error | 5 | ✅ Fixed | Fixed FK ambiguity |
| 4 | RLS blocking writes | 5 | ✅ Fixed | Admin client workaround |
| 5 | DCA Management missing | 6 | ✅ Fixed | Full CRUD UI |
| 6 | Analytics placeholder | 7 | ✅ Fixed | Recharts implemented |
| 7 | Reports page missing | 7 | ✅ Fixed | Template gallery |
| 8 | SLA Management missing | 8 | ✅ Fixed | Templates + activity |
| 9 | Notifications missing | 8 | ✅ Fixed | Read/unread handling |
| 21 | No toast notifications | Sprint1 | ✅ Fixed | ToastProvider + animations |
| 22 | No skeleton loaders | Sprint1 | ✅ Fixed | Skeleton components ready |
| 16 | No confirmation dialogs | Sprint1 | ✅ Fixed | ConfirmProvider ready |

**Total Fixed: 12 items** ✅

---

## 🔴 Critical Priority (3 items)

| # | Issue | Phase | Status | Notes |
|---|-------|-------|--------|-------|
| 10 | RBAC not enforced in APIs | 3 | ⏳ Pending | Any user can access any endpoint |
| 11 | No proper RLS INSERT/UPDATE | 5 | ⏳ Pending | Using admin client workaround |
| 12 | UI doesn't check permissions | 3 | ⏳ Pending | No PermissionGate component |

---

## 🟡 High Priority (8 items)

| # | Issue | Phase | Status | Notes |
|---|-------|-------|--------|-------|
| 13 | User profile not auto-created | 3 | ⏳ Pending | New users fail |
| 14 | No user/role management UI | 4 | ⏳ Pending | Settings page needed |
| 15 | Input validation basic only | 4 | ⏳ Pending | Need Zod schemas |
| 17 | Form state lost on error | 5-6 | ⏳ Pending | Forms reset |
| 18 | No pagination in DCA cases | 6 | ⏳ Pending | Shows first 10 only |
| 19 | Report generation fake | 7 | ⏳ Pending | Buttons are placeholders |
| 20 | SLA create/edit not impl | 8 | ⏳ Pending | Button exists, no form |

---

## 🟢 Medium Priority (5 items)

| # | Issue | Phase | Status | Notes |
|---|-------|-------|--------|-------|
| 23 | No optimistic updates | 5-6 | ⏳ Pending | Wait for server |
| 24 | Date filter not functional | 7 | ⏳ Pending | Dropdown visual only |
| 25 | Export button not working | 7 | ⏳ Pending | No implementation |
| 26 | Notif preferences missing | 8 | ⏳ Pending | Button exists, no page |
| 27 | Mark all as read slow | 8 | ⏳ Pending | Sequential API calls |

---

## 🔵 Low Priority / Tech Debt (7 items)

| # | Issue | Phase | Status | Notes |
|---|-------|-------|--------|-------|
| 28 | TypeScript `as any` | 4 | ⏳ Pending | Need proper types |
| 29 | No unit tests | 12 | ⏳ Pending | Future phase |
| 30 | No E2E tests | 12 | ⏳ Pending | Future phase |
| 31 | MFA not enforced | 3 | ⏳ Pending | Structure only |
| 32 | Dark mode broken | UI | ⏳ Pending | Toggle no effect |
| 33 | Mobile responsive | UI | ⏳ Pending | Desktop-first |
| 34 | ESLint nullish warnings | 7 | ⏳ Pending | Minor |

---

## 📊 Summary

| Category | Count |
|----------|-------|
| ✅ Fixed | 12 |
| 🔴 Critical | 3 |
| 🟡 High | 7 |
| 🟢 Medium | 5 |
| 🔵 Low/Debt | 7 |
| **Total Pending** | **22** |

---

## 🎯 Recommended Next Actions

### Sprint 2: Integration (use the components we built)
- [ ] Integrate skeleton loaders on Cases/DCAs list pages
- [ ] Add confirm dialogs before delete actions
- [ ] Add toast notifications on DCA create/edit forms
- [ ] Add loading states on submit buttons

### Sprint 3: Critical Security
- [ ] #10 - RBAC enforcement in APIs
- [ ] #12 - PermissionGate component for UI
- [ ] #13 - Auto-create user profile on signup

### Sprint 4: Settings & Management
- [ ] #14 - User/role management UI
- [ ] #20 - SLA template create/edit forms

---

*Last updated: Sprint 1 complete (Dec 28, 2025)*
