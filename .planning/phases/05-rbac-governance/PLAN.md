# GSD Phase 05 - RBAC & Governance

**Status: PLANNED ⏳**

## Overview
Implement role-based access control for coordinators, scoped visibility by group, and skill/role uniqueness per group.

## Tasks
- [ ] Database: Update `Skill`, `Event`, and `FixedScale` schemas to include `groupId` linkage
- [ ] API: Update `habilidades.ts` for scoped uniqueness (same function name allowed in different groups)
- [ ] API: Middleware RBAC — coordinators see only their group's events and members
- [ ] UI: Filter member list and event list by `groupId` when role is COORDINATOR
- [ ] UI: Skill/Role creation shortcut in EventManager and MemberForm

## Verification Plan
### Manual
- Login as COORDINATOR → verify only own group events visible
- Login as ADMIN → verify all events visible
### Automated
- API returns 403 when coordinator requests other group's members
