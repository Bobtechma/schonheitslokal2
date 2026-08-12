# Phase 09: Professional Availability UX - Plan

**Goal:** Show real-time availability counts per professional in Step 3 of the booking form, filtering out fully-booked professionals to prevent client frustration.

## Tasks

### Task 1: Create shared availability utility
- **File:** `src/lib/availability.ts` (NEW)
- **Purpose:** Extract availability calculation logic into a reusable function
- **Function signature:**
  ```typescript
  interface ProAvailability {
    professionalId: string
    availableSlots: string[]
    slotCount: number
  }

  export async function getAvailabilityPerProfessional(
    date: string,
    services: { id: string; duration_minutes: number }[],
    totalDuration: number,
    specificProfessionalId?: string | null
  ): Promise<Map<string, ProAvailability>>
  ```
- **Logic:** Reuse the same data fetching as `fetchAvailableTimes` but aggregate per-professional instead of flat list
- **Key change:** Instead of `capablePros.some(prof => ...)`, iterate each pro and track slots individually

### Task 2: Update ProfessionalSelection to show availability
- **File:** `src/components/BookingForm.tsx` lines 504-645
- **Changes:**
  - Add `availability` state: `Record<string, number>`
  - Add `availabilityLoading` state
  - After filtering professionals by capability/schedule, call `getAvailabilityPerProfessional`
  - Filter out professionals with `slotCount === 0` (fully booked)
  - Show availability badge on each card:
    - 3+ slots: green badge "X horários disponíveis"
    - 1-2 slots: yellow/orange badge "X horários disponíveis"
    - 0 slots: hidden from list
  - "Qualquer Profissional" card shows total combined availability

### Task 3: Update TimeSelection to use shared utility
- **File:** `src/components/BookingForm.tsx` lines 683-851
- **Changes:**
  - Replace inline `fetchAvailableTimes` logic with call to `getAvailabilityPerProfessional`
  - Aggregate results: if `selectedProfessionalId` is set, use that pro's slots; otherwise merge all
  - Keep existing UI rendering (time slot grid)

### Task 4: Add translation keys
- **File:** `src/lib/translations.ts`
- **Keys to add:**
  - `slotsAvailable`: "X horários disponíveis" (DE: "X Zeiten verfügbar")
  - `fullyBooked`: "Lotada" (DE: "Ausgebucht")
  - `noProfessionalsAvailable`: "Nenhuma profissional disponível para esta data" (DE: "Keine Fachkraft verfügbar")

## Success Criteria
- [ ] Professional list shows availability counts (e.g., "5 horários disponíveis")
- [ ] Fully-booked professionals are hidden from the list
- [ ] "Qualquer Profissional" shows combined availability
- [ ] Step 4 (TimeSelection) shows the same slots that Step 3 promised
- [ ] No duplicate database queries (single call for all professionals)
- [ ] Loading state shown while availability is calculated
