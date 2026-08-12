# Phase 09: Professional Availability UX - Research

**Researched:** 2026-04-07
**Domain:** Client booking flow - professional availability filtering
**Confidence:** HIGH

## Summary

The `BookingForm.tsx` uses a 6-step wizard. The current order is correct (Services → Date → Professionals → Time), but Step 3 (ProfessionalSelection) shows ALL professionals who work that day regardless of actual availability. The real availability check only happens in Step 4 (TimeSelection).

**Problem:** Client selects a professional in Step 3, advances to Step 4, and finds zero available slots — frustrating UX.

**Solution:** Filter out fully-booked professionals in Step 3, show availability counts per professional.

## Current Flow

```
Step 1: Services → Step 2: Date → Step 3: Professionals → Step 4: Time → Step 5: Client Info → Step 6: Confirmation
```

### ProfessionalSelection (Step 3) — Lines 504-645
- Filters by: service capability + day-of-week schedule
- Does NOT check: existing appointments, blocked slots, blocked dates
- Result: shows professionals who *could* work that day, even if fully booked

### TimeSelection (Step 4) — Lines 683-898
- `fetchAvailableTimes` (lines 696-851) does the REAL availability calculation
- Checks: blocked_dates, business_hours, appointments, blocked_slots, professional schedules
- Returns: flat `string[]` of available times — no per-professional breakdown

## Architecture: Shared Availability Utility

**Recommended approach:** Extract availability logic into `src/lib/availability.ts`

```typescript
interface ProfessionalAvailability {
  professionalId: string;
  availableSlots: string[];
  slotCount: number;
}

export async function getAvailabilityPerProfessional(
  date: string,
  services: Service[],
  totalDuration: number,
  specificProfessionalId?: string | null
): Promise<Map<string, ProfessionalAvailability>>
```

This function reuses the same logic as `fetchAvailableTimes` but returns per-professional breakdown instead of a flat list.

## Key Files to Modify

| File | Lines | Change |
|------|-------|--------|
| `src/lib/availability.ts` | NEW | Shared availability calculation utility |
| `src/components/BookingForm.tsx` | 504-645 | ProfessionalSelection: add availability counts, filter out fully booked |
| `src/components/BookingForm.tsx` | 683-851 | TimeSelection: use shared utility instead of inline logic |
| `src/lib/translations.ts` | ~215, ~612 | Add translation keys for availability labels |

## What "Fully Booked" Means

A professional is fully booked when:
1. The date is globally blocked (`blocked_dates`) → ALL professionals unavailable
2. The salon is closed that day (`business_hours` missing) → ALL professionals unavailable
3. The professional has no active schedule for that day of week → unavailable
4. The professional cannot perform ALL selected services → unavailable
5. All time slots within the professional's schedule are occupied by existing appointments or blocked slots → fully booked

## Visual Design Recommendations

```
┌─────────────────────────────────────────┐
│  👩 Maria Silva                         │
│     5 horários disponíveis  ✅          │  ← Green badge
├─────────────────────────────────────────┤
│  👩 Ana Souza                           │
│     2 horários disponíveis  ⚠️          │  ← Yellow badge (low availability)
├─────────────────────────────────────────┤
│  👩 Joana Costa                         │
│     Sem horários disponíveis  ❌        │  ← Grayed out / hidden
└─────────────────────────────────────────┘
```

**Thresholds:**
- 3+ slots: "X horários disponíveis" (green)
- 1-2 slots: "X horários disponíveis" (yellow/orange)
- 0 slots: Hide from list OR show grayed out with "Lotada"

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Availability calculation | Duplicate fetchAvailableTimes logic | Extract to shared utility | Single source of truth |
| Professional cards | New component from scratch | Enhance existing card pattern | Consistent styling |
| Loading states | Custom spinner | Existing loading pattern | Consistent UX |

## Common Pitfalls

### Pitfall 1: N+1 queries
**What goes wrong:** Calling the availability function once per professional = N database queries.
**How to avoid:** Calculate availability for ALL capable professionals in a single function call (same data fetch, different aggregation).

### Pitfall 2: Stale availability data
**What goes wrong:** Availability is calculated on Step 3, but by the time user reaches Step 4, another booking may have filled the last slot.
**How to avoid:** Re-fetch availability in Step 4 as well. The availability counts in Step 3 are a guide, not a guarantee.

### Pitfall 3: Performance on slow connections
**What goes wrong:** Adding availability calculation to Step 3 increases load time.
**How to avoid:** Use the same single API call approach. The data is already fetched in `fetchAvailableTimes` — just aggregate differently.

## Sources

### Primary (HIGH confidence)
- `src/components/BookingForm.tsx` — ProfessionalSelection (504-645), TimeSelection (683-898), fetchAvailableTimes (696-851)
- `src/stores/bookingStore.ts` — Booking state management

**Research date:** 2026-04-07
**Valid until:** 2026-05-07
