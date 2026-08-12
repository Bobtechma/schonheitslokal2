# Phase 15: Critical Fix - Blocked Days & Intervals

## Goal
Fix the critical bug where blocked days or intervals still allow appointments to be scheduled. The system must strictly respect blocked slots during the availability calculation.

## Status: 🔄 Em Progresso

## Tasks
- [ ] Audit `src/lib/availability.ts` and the `get_available_slots` RPC.
- [ ] Verify how "blocked slots" are stored in the database.
- [ ] Ensure the interval comparison logic considers blocked time ranges correctly.
- [ ] Handle "Cleaning Time" / Buffer intervals between appointments.
- [ ] Test blocking logic against both global settings and professional-specific overrides.

## Technical Notes
- The user mentioned that appointments happen even on blocked days.
- We need to check if the `active` status or a separate `blocked_slots` table is being ignored.
- Availability logic is centralized in `src/lib/availability.ts`.
