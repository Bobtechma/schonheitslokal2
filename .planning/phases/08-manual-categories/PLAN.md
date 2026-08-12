# Phase 08: Categorize Manual Booking and Sales - Plan

**Goal:** Organize manual booking into "Agendamento Manual" and "Venda Manual de Produtos" with distinct entry points and visual differentiation in the appointment list.

## Tasks

### Task 1: Add "Nova Venda" button alongside "Novo Agendamento"
- **File:** `src/pages/AdminDashboard.tsx`
- **Lines:** 2736-2749 (daily view), 2910-2923 (weekly view)
- **Change:** Add a second button "Nova Venda" that opens the modal with `manualCategory = 'product'`
- The existing "Create Appointment" button stays as "Novo Agendamento" (service)
- New button: "Nova Venda" (product) with Package icon

### Task 2: Add visual differentiation in appointment list
- **File:** `src/pages/AdminDashboard.tsx`
- **Lines:** 2673-2731 (appointment card rendering)
- **Change:** Detect if appointment is product-only (total_duration_minutes === 0 or all services are products)
- Add a badge/icon: `Package` for product sales, `Scissors` for service appointments
- Adjust time badge display for product sales (show "Venda" instead of "00:00")

### Task 3: Verify and fix RPC professional_id issue
- **File:** `src/pages/AdminDashboard.tsx`
- **Lines:** 2004-2073 (handleManualCreate RPC path)
- **Change:** Check if `create_appointment_with_services` RPC accepts `professional_id`. If not, ensure the fallback path always handles it correctly, or create a migration to update the RPC.

### Task 4: Update translation keys
- Add translation keys for "Nova Venda", "Venda", "Produto" badges

## Success Criteria
- [ ] Two distinct buttons: "Novo Agendamento" (service) and "Nova Venda" (product)
- [ ] Appointment list shows visual distinction between service bookings and product sales
- [ ] Product sales show "Venda" badge instead of time
- [ ] No errors when creating manual bookings or sales
- [ ] Professional is correctly assigned in both RPC and fallback paths
