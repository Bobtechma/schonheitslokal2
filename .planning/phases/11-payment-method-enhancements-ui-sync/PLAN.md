# Phase Plan: Payment Method Enhancements & UI Sync

## Background
The admin dashboard was missing critical payment information in the daily view, and the technical keys for payment methods were inconsistent across the application. This phase was launched to synchronize the UI, automate payment labeling, and ensure a professional data representation.

## Proposed Changes

### 1. Data Layer
- [x] Fix `fetchAppointments` in `AdminDashboard.tsx` to include `payment_method` and `source`.
- [x] Update `RawAppointment` interface to ensure type safety.
- [x] Implement fallback to "salon" for legacy records.

### 2. UI Components
- [x] Standardize payment labels using translation keys.
- [x] Integrate Lucide icons (`Wallet`, `CreditCard`) into all appointment list badges.
- [x] Sync `AdminDashboard.tsx`, `AppointmentsTab.tsx`, and `ConfirmationPage.tsx`.

## Verification Records

### Manual Verification
- [x] Verified Day view displays Correct labels and icons.
- [x] Verified Week view matches Day view styling.
- [x] Verified Customer Confirmation page shows consistent details.
