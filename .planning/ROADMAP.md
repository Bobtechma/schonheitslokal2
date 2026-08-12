# RoadMap: Schönheits Lokal

## Current Milestone: V1.5 - Booking Stability & UX Polish

### Phase 01: Fix Build Errors [x]
- [x] Fix ESLint `no-explicit-any` errors in frontend.
- [x] Fix TypeScript unused imports and type mismatches.
- [x] Ensure `npm run build` passes for production.

### Phase 02: Functional Bug Fixes [x]
- [x] Fix service selection persistence issues.
- [x] Fix professional assignment UI in the booking flow.
- [x] Ensure client data is correctly saved in the database.

### Phase 03: UI Performance & Refinement [x]
- [x] Optimize dashboard charts and visualizations.
- [x] Enhance mobile responsiveness for the booking form.
- [x] Cleanup UI redundancy in the sidebar and navigation.
- [x] Implement glassmorphism design tokens across all components.

### Phase 04: Advanced Scheduling & Calendar Integration [x]
- [x] Database: Optimize tables for appointments and service relationships.
- [x] UI: Implementation of the Admin Daily/Weekly calendar view.
- [x] Logic: Real-time slot calculation based on professional schedules.

### Phase 05: RBAC & Access Control [x]
- [x] Implement roles for "Admin" and "Professional".
- [x] Secure dashboard views based on login permissions.

### Phase 06: Notifications & Availability Registration [x]
- [x] Basic notification system for new bookings.
- [x] Allow professionals to register their availability or blocked dates.

### Phase 07: Fix Attendant Availability [x]
- [x] Fix bug where slots were available on non-working days.
- [x] Strictly validate active schedule records during slot calculation.

### Phase 08: Categorize Manual Booking and Sales [x]
- [x] Add distinct "Novo Agendamento" and "Nova Venda" buttons for faster manual entry.
- [x] Visual differentiation in the appointment list (Package icon for product sales).
- [x] Fix RPC `create_appointment_with_services` to handle professional assignment correctly.

### Phase 09: Professional Availability UX [x]
- [x] Show real-time availability counts per professional in the booking flow.
- [x] Filter out fully-booked professionals from the selection list.
- [x] Centralize logic into `src/lib/availability.ts` to ensure consistency.
- [x] Update time selection step to reflect real-time professional capacity.

### Phase 10: Admin Dashboard Modularization [/]
- [ ] Analyze state dependencies used in each tab.
- [ ] Migrate Marketing tab to external component.
- [ ] Migrate Settings tab to external component.
- [ ] Migrate System tab to external component.
- [ ] Migrate Services tab to external component.
- [ ] Clean up inline code and unused imports.
- [ ] Ensure build passes without TypeScript errors.

### Phase 11: Payment Method Enhancements & UI Sync [x]
- [x] Standardize payment methods (`payAtSalon` -> `paymentSalon`) for i18n support.
- [x] Add payment method icons (Wallet/CreditCard) to all Admin Dashboard views.
- [x] Fix `payment_method` and `source` field mapping in `AdminDashboard.tsx` fetch logic.
- [x] Update `BookingForm.tsx` and email generation to include correct payment labels.
- [x] Ensure `ConfirmationPage.tsx` displays consistent payment icons and badges.
- [x] Implement fallback to "No Salão" for legacy appointments without payment data.

### Phase 12: Appointment Details Popup & Stability [x]
- [x] Implement premium modal for detailed appointment viewing in Admin Dashboard.
- [x] Add click triggers to Table and List (Mobile) views.
- [x] Integrate full client, professional, and service details into the popup.
- [x] Fix `RangeError: Invalid time value` bug in date utilities.
- [x] Improve `utils.ts` to handle ISO strings and invalid date inputs gracefully.

### Phase 13: Store Identity & Contact Refinement [x]
- [x] Correct central address from `Kalkbreitestrasse` to `Kalkbreitstrasse 129, 8003 Zurich`.
- [x] Synchronize address across footer, booking flow, and privacy pages.
- [x] Update SEO metadata and structured data in `index.html`.
- [x] Correct outdated `Sternenstrasse` entry in `ConfirmationPage.tsx`.
- [x] Update WhatsApp and Email notification templates.

### Phase 14: Grid Visibility & UI Accessibility [x]
- [x] Remove hover-based opacity for action buttons in the Weekly Grid.
- [x] Set "Plus" add-appointment icons to 100% opacity for better tablet/mobile discovery.
- [x] Ensure service details and payment icons in appointment blocks are fully opaque.
- [x] Limit changes to `AppointmentsTab.tsx` to maintain dashboard style consistency.

### Phase 15: Critical Fix - Blocked Days & Intervals [x]
- [x] Investigate why blocked days/intervals still show as available.
- [x] Enhance `get_available_slots` RPC to strictly filter out slots within blocked periods.
- [x] Integrate `blocked_times` (date-specific) and `blocked_slots` (global timestamptz) logic.
- [x] Implement 10-minute buffer interval between appointments.

### Phase 16: UI Visibility Enhancements [x]
- [x] Move "Novo Agendamento" and "Nova Venda" buttons to prominent header controls.
- [x] Ensure buttons are always visible (100% opacity) on all devices.
- [x] Improve filter bar responsiveness for mobile devices (flex-wrap/gaps).
- [x] Remove redundant manual booking buttons from appointment list rows.
- [x] Maintain consistent styling with pink/emerald theme.

### Phase 17: Final Polish & Audit [x]
- [x] Perform full UI/UX audit using `ux_audit.py`.
- [x] Verify accessibility compliance.
- [x] Final verification of blocked dates/intervals on production-like environment.

### Phase 18: Admin Appointment Editing & SEO Optimization [x]
- [x] Implement secure and rigorous admin appointment editing in the details modal.
- [x] Implement strict conflict validation checking for date/time and professional.
- [x] Implement auto-notifications (Reschedule email and WhatsApp).
- [x] Implement advanced dynamic SEO (canonical, hreflang, descriptions, sitemap, robots.txt).
- [x] Create a high-end, real-effect granular Cookie Consent banner.

### Phase 19: Regional Partner Salons Integration [x]
- [x] DB: Create `partner_orders` and `partner_order_items` tables with proper RLS policies.
- [x] DB: Seed new system settings for partner discount, min order, and German/Portuguese contracts.
- [x] API: Implement `create-partner-checkout` and `create-second-payment` Stripe Checkout endpoints.
- [x] API: Implement `confirm-partner-payment` handler to record statuses and send automatic email receipts.
- [x] FE: Create `/parceria` (PartnerArea) page with product catalog, cart calculations, min order validation, contract agreement, and payment method selection (Card/Boleto).
- [x] FE: Create `/pagar-saldo` (PaySecondHalf) page to process the remaining 50% payment.
- [x] FE: Update `AdminDashboard.tsx` settings and user management to support configuring partner attributes and promoting users.
- [x] FE: Integrate route security and navigation links in Header and ProfilePage.

---



## Recent Fixes Log (2024-04-11)

### Fix: Booking RPC 404 Error [x]
- **Problem**: RPC `create_appointment_with_services` returned 404
- **Solution**: Changed to direct INSERT in both BookingForm.tsx and AdminDashboard.tsx
- **Verification**: Both use same availability logic from getAvailabilityPerProfessional
- **Files Modified**: 
  - src/components/BookingForm.tsx
  - src/pages/AdminDashboard.tsx

### Fix: Weekly/Daily View Not Showing [x]
- **Problem**: Appointments missing in weekly and daily views
- **Solution**: Fixed date comparison using string format (YYYY-MM-DD)
- **Files Modified**: src/pages/AdminDashboard.tsx

### Fix: Booking Conflict Detection [x]
- **Problem**: Could book overlapping time slots
- **Solution**: Added overlap check considering duration
- **Implementation**: Both BookingForm and AdminDashboard check existing appointments
- **Logic**: `newStart >= existStart && newStart < existEnd` OR `newEnd > existStart && newEnd <= existEnd`

## Recent Fixes Log (2026-04-25)

### Enhancement: Payment Methods & Dashboard Sync [x]
- **Problem**: Payment information was missing in Admin Day view; inconsistent technical keys (`payAtSalon`).
- **Solution**: Fixed data mapping in `fetchAppointments`, synced all dashboard variations with Lucide icons (Wallet/CreditCard), and mapped all technical keys to translation-ready IDs.
- **Verification**: Verified across Daily view, Weekly view, and customer confirmation pages.
- **Files Modified**: 
  - src/pages/AdminDashboard.tsx
  - src/components/dashboard/tabs/AppointmentsTab.tsx
  - src/pages/admin/tabs/AppointmentsTab.tsx
  - src/pages/ConfirmationPage.tsx
  - src/lib/email.ts
  - src/components/BookingForm.tsx

### Enhancement: Appointment Details & Date Stability [x]
- **Problem**: Dashboard lacked a quick way to view full appointment details; encountered `RangeError: Invalid time value` in date formatting.
- **Solution**: Implemented a comprehensive modal for appointment details- [x] Robustified `utils.ts` date formatting functions to handle partial or invalid data without crashing.
- **Files Modified**: 
  - src/pages/AdminDashboard.tsx
  - src/lib/utils.ts

### Fix: Address Inconsistency & SEO [x]
- **Problem**: Incorrect spelling `Kalkbreitestrasse` was present in UI and SEO metadata; outdated `Sternenstrasse` address in confirmation page.
- **Solution**: Standardized to `Kalkbreitstrasse 129, 8003 Zurich` across all customer touchpoints (UI, Meta tags, automated messages).
- **Files Modified**: 
  - src/pages/HomePage.tsx
  - src/pages/BookingPage.tsx
  - src/pages/PrivacyPage.tsx
  - src/pages/ConfirmationPage.tsx
  - src/lib/email.ts
  - src/lib/whatsapp.ts
  - index.html
  
## Recent Fixes Log (2026-05-06)

### Enhancement: Appointment Grid Visibility [x]
- **Problem**: Action buttons (Plus icon) were hidden behind hover, making it impossible to add appointments easily on touch devices.
- **Solution**: Removed `opacity-0 group-hover:opacity-100` and set `opacity-100` as default. Increased opacity of service details for better readability.
- **Files Modified**: 
  - src/pages/admin/tabs/AppointmentsTab.tsx

## Recent Fixes Log (2026-05-31)

### Enhancement: Admin Editing, SEO & Cookie Consent [x]
- **Problem**: Admin lacks editing of client appointments. SEO and sitemap are outdated. Cookie consent is missing. High FCP (3.0s), LCP (4.4s), CLS (0.394) and Speed Index (4.8s) scores in GSC. AMD RX 580 GPU spikes to 100% and crashes the driver when opening the system due to Canvas shadowBlur overhead.
- **Solution**: Implement rigorous appointment rescheduling in AdminDashboard details modal with real-time slot conflict checking and automated notifications. Deploy dynamic SEO metadata helper (hreflang/canonical) and sitemap/robots modifications. Inject custom high-end Glassmorphism Cookie Consent banner. Eager-load ProductCarousel, set non-render-blocking Google Fonts, lock carousel layout loading aspect ratio, pre-render hero services grid using static fallback to eliminate CLS and boost Speed Index/FCP/LCP. Completely eliminated expensive canvas shadowBlur and shadowColor from both bulbs and wheel slices in RoulettePopup, replacing them with a vector aura and a high-contrast native outline (`strokeText`), fully fixing TDR GPU crashes on AMD RX 580. Fixed manual booking creation validation on AdminDashboard to prevent client-facing fillDataError from showing, making email and phone 100% optional, and sending notifications only when provided. Implemented a WhatsApp Queue worker standby/active toggle switch, resolving constant ERR_CONNECTION_REFUSED connection errors when local port 8085 is offline. Created a dynamic `<LazyBackgroundVideo />` component using IntersectionObserver to auto-pause off-screen videos (resolving race conditions via permanent DOM binding and dynamic source injection with explicit video.load() triggers), and optimized the 6 background video sources in HomePage.tsx from heavy 1080p (_large.mp4) to lightweight 720p (_medium.mp4), completely solving GPU overhead spikes and scrolling crashes.
- **Files Modified**:
  - src/pages/AdminDashboard.tsx
  - src/lib/email.ts
  - src/lib/whatsapp.ts
  - src/components/RoulettePopup.tsx
  - src/components/LazyBackgroundVideo.tsx (NEW)
  - src/pages/HomePage.tsx
  - src/App.tsx
  - src/lib/seo.ts (NEW)
  - src/components/CookieConsent.tsx (NEW)
  - src/lib/translations.ts
  - public/sitemap.xml
  - public/robots.txt

## Recent Fixes Log (2026-06-01)

### Enhancement: Admin Appointment Editing - Preservation and Live Visual Warnings [x]
- **Problem**: When editing an appointment, changing the professional or date automatically resets the selected time, forcing re-selection. No visual feedback is shown inside the dropdown when the selected time is occupied for the new selection.
- **Solution**: Removed the auto-resetting of the time state in date and professional inputs, preserving the original selections. Dynamically append `(Indisponível)` / `(Nicht verfügbar)` to the currently occupied times inside the dropdown options list. Inject a real-time caution message under the time selector if it remains occupied.
- **Files Modified**: 
  - src/pages/AdminDashboard.tsx


