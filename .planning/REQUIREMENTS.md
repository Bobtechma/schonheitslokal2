# Requirements: Schönheits Lokal Booking System

## 1. Booking Flow (Fluxo de Agendamento)
- **FR-01**: Clients must be able to select one or multiple services.
- **FR-02**: System must calculate real-time availability per professional.
- **FR-03**: Professional selection must show available slot counts (e.g., "5 available slots").
- **FR-04**: Fully booked professionals must be filtered out from the selection step.

## 2. Professional Management
- **FR-05**: Professionals must have individual business hours and blocked dates.
- **FR-06**: Admin must be able to assign colors to professionals for identification on the calendar.

## 3. Sales & Appointments
- **FR-07**: System must distinguish between a service booking and a direct product sale.
- **FR-08**: Visual badges and icons must differentiate sales from appointments in the dashboard.

## 4. Multi-language (i18n)
- **FR-09**: Full localization for Swiss-German (de-CH) and Portuguese (pt-BR).
- **FR-10**: Support for currency formatting (CHF).

## 5. Security & Performance
- **NFR-01**: Secure data persistence via Supabase Auth and RLS.
- **NFR-02**: Optimized slot calculation to ensure sub-second response times in the booking form.
- **NFR-03**: Responsive design with bottom-sheet modals for mobile users.
