# Phase 07 PLAN: Fix Attendant Availability

## Goal
Ensure that attendants (professionals) are only available for scheduling on days where they have an active schedule record defined.

## Proposed Changes

### 1. `src/components/BookingForm.tsx`
- Modify the `fetchAvailableTimes` function.
- Change the filter logic for `availablePros`.
- Instead of defaulting to available when no schedule is found, it will now default to unavailable.

### 2. `src/pages/AdminDashboard.tsx`
- Modify the manual booking availability check logic (inside `useEffect` for `manualBooking`).
- Apply the same strict schedule validation as in `BookingForm.tsx`.

## Verification Plan

### Manual Verification
1. **Client Booking**: Attempt to book a professional on a day they are NOT scheduled (e.g., Sunday if they only work Mon-Fri).
   - **Expected**: No time slots should appear.
2. **Admin Dashboard**: Open "New Appointment" and select a professional on their off-day.
   - **Expected**: The "Available Times" list should be empty.
