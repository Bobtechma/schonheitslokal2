# Phase 08: Categorize Manual Booking and Sales - Research

**Researched:** 2026-04-07
**Domain:** React/TypeScript UI categorization, Supabase-backed salon scheduling system
**Confidence:** HIGH

## Summary

The system already has a **single unified manual modal** in `AdminDashboard.tsx` (lines 4348-4585) that toggles between "service" and "product" categories via a `manualCategory` state variable (`'service' | 'product'`). The modal title changes based on category: "Agendamento Manual" for services and "Venda Manual de Produtos" for products. The `handleManualCreate` function (lines 1882-2079) already handles both paths — skipping time/professional selection and conflict checks for products, and updating stock after product sales.

**Primary recommendation:** The modal already has the two-category toggle. The phase likely involves UI refinements, ensuring the distinction is clear across the system (appointment list badges, client source tracking, stats), and possibly separating the two flows into more distinct UX patterns rather than a single toggle.

## User Constraints (from CONTEXT.md)

*No CONTEXT.md found — no locked decisions to honor.*

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x | UI framework | Project foundation |
| TypeScript | 5.x | Type safety | Already in use throughout |
| Supabase JS | 2.x | Database client | All data operations use this |
| Zustand | 4.x | State management | Used for `bookingStore` |
| Tailwind CSS | 3.x | Styling | All components use Tailwind classes |
| Lucide React | latest | Icon library | Already imported (Calendar, Package, etc.) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Sonner | latest | Toast notifications | Already used for all toasts |
| React Router DOM | 6.x | Navigation | AdminDashboard uses `useNavigate` |

## Architecture Patterns

### Current Manual Modal Structure (AdminDashboard.tsx, lines 4348-4585)

The modal uses a **category toggle pattern** — a two-button pill toggle at the top:

```
┌─────────────────────────────────────────┐
│  [📅 Agendamento] [📦 Produtos]        │  ← Category toggle
├─────────────────────────────────────────┤
│  Date: [________]  Professional/Notes   │  ← Conditional fields
│  Client: [ClientSearch component]       │
│  Email: [________]  Phone: [________]   │
│  Notes: [________________________]      │
│  ┌─ Services/Products List ───────────┐ │
│  │ ☐ Service A  30 min • CHF 50       │ │
│  │ ☑ Product B  CHF 85  • Estoque: 12 │ │
│  └────────────────────────────────────┘ │
│  ┌─ Available Times (service only) ───┐ │
│  │ [09:00] [09:30] [10:00] ...       │ │
│  └────────────────────────────────────┘ │
│              [Close] [Create]            │
└─────────────────────────────────────────┘
```

### Key State Variables (AdminDashboard.tsx, lines 205-210)

```typescript
const [manualModalOpen, setManualModalOpen] = useState(false)
const [manualCategory, setManualCategory] = useState<'service' | 'product'>('service')
const [manualForm, setManualForm] = useState({
  clientIdentifier: '',
  date: new Date().toISOString().split('T')[0],
  time: '',
  notes: '',
  selectedServiceIds: [] as string[],
  email: '',
  phone: ''
})
const [manualProfessionalId, setManualProfessionalId] = useState<string | null>(null)
const [manualAvailableTimes, setManualAvailableTimes] = useState<string[]>([])
const [manualTimesLoading, setManualTimesLoading] = useState(false)
```

### Current Category Differences

| Field | Service (Agendamento Manual) | Product (Venda Manual de Produtos) |
|-------|------------------------------|-----------------------------------|
| Professional selection | ✅ Select professional | ❌ Hidden |
| Time selection | ✅ Available time slots | ❌ Defaults to `00:00` |
| Conflict checking | ✅ Full overlap check | ❌ Skipped |
| Stock update | ❌ N/A | ✅ Decrements stock |
| Notes field | After professional/email | After date (inline) |
| Time in DB | User-selected time | `00:00:00` |
| Notes default | User input | `"Venda de produtos (manual)"` |

### Recommended Project Structure

No new files needed — this is a refactor of existing components. The work is contained in:

```
src/
├── pages/
│   └── AdminDashboard.tsx     # Main changes: modal UI, create logic
├── components/
│   └── BookingForm.tsx        # Reference: already handles product vs service
├── stores/
│   └── bookingStore.ts        # Reference: already handles product orders
└── lib/
    ├── supabase.ts            # Type definitions
    └── translations.ts        # Add translation keys for new UI
```

### Pattern: Category-Conditional Rendering

The existing pattern in the modal uses ternary conditionals on `manualCategory`:

```typescript
// Lines 4404-4433: Conditional professional vs notes field
{manualCategory === 'service' ? (
  <div className="md:col-span-1">
    <label>{t('selectProfessional')}</label>
    <select value={manualProfessionalId || ''} onChange={...}>
      ...
    </select>
  </div>
) : (
  <div className="md:col-span-1">
    <label>{t('notes')}</label>
    <input value={manualForm.notes} onChange={...} />
  </div>
)}

// Lines 4490-4500: Notes only for services (duplicate field)
{manualCategory === 'service' && (
  <div className="md:col-span-2">
    <label>{t('notes')}</label>
    <input value={manualForm.notes} onChange={...} />
  </div>
)}

// Lines 4509: Filter services/products
.filter(s => (manualCategory === 'product' ? s.category === 'product' : s.category !== 'product'))

// Lines 4542: Time slots only for services
{manualCategory === 'service' && (
  <div className="md:col-span-2">
    <label>{t('availableTime')}</label>
    ...
  </div>
)}
```

### Anti-Patterns to Avoid

- **Do NOT create separate modals** — the current single-modal-with-toggle pattern is correct and maintainable
- **Do NOT duplicate the `handleManualCreate` function** — extend the existing one with category-specific branches
- **Do NOT create a new database table** — the `services` table with `category` column already supports both; `appointments` table stores both bookings and sales
- **Avoid adding `source` field without migration** — if tracking "manual" vs "website" origin, requires a DB migration

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Category toggle UI | Custom toggle component | Existing pill toggle pattern (lines 4361-4391) | Already styled, consistent with project |
| Client search | New search component | `ClientSearch` component (already imported, line 59) | Reusable, already handles client lookup |
| Stock decrement | Manual stock logic per item | Existing loop in `handleManualCreate` (lines 2019-2032) | Already handles stock updates |
| Time slot generation | Custom time generator | Existing `fetchManualTimes` useEffect (lines 349-468) | Already computes availability correctly |
| Price calculation | Custom pricing logic | `applyPriceWithPromotions` (lines 2081-2086) | Already handles store and per-service discounts |

**Key insight:** The system already stores both services and products in the same `services` table (differentiated by `category` column), and both bookings and sales in the same `appointments` table. The modal already differentiates between them. The phase is about **categorization and UX clarity**, not building new infrastructure.

## Database Schema

### Relevant Tables

**`services`** — stores both services AND products
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `name` | VARCHAR(255) | |
| `description` | TEXT | |
| `duration_minutes` | INTEGER | CHECK >= 0 (modified for products) |
| `price` | DECIMAL(10,2) | |
| `category` | VARCHAR(100) | `'service'` or `'product'` |
| `active` | BOOLEAN | |
| `display_order` | INTEGER | |
| `stock` | INTEGER | Products only (added via migration) |
| `weight` | NUMERIC | Products only (added via migration) |
| `subcategory` | TEXT | |
| `name_pt`, `name_de` | TEXT | Translations |
| `description_pt`, `description_de` | TEXT | Translations |
| `image_url` | TEXT | |

**`appointments`** — stores both bookings AND sales
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `client_id` | UUID FK → clients | |
| `user_id` | UUID FK → auth.users | Admin who created it |
| `professional_id` | UUID FK → professionals | NULL for products |
| `appointment_date` | DATE | |
| `appointment_time` | TIME | `00:00:00` for product-only |
| `total_duration_minutes` | INTEGER | 0 for products |
| `total_price` | DECIMAL(10,2) | |
| `status` | VARCHAR(50) | confirmed/completed/cancelled/no_show |
| `notes` | TEXT | `"Venda de produtos (manual)"` for product sales |
| `is_paid` | BOOLEAN | |
| `payment_method` | VARCHAR | |
| `payment_status` | VARCHAR | |
| `stripe_payment_intent_id` | VARCHAR | |
| `source` | VARCHAR | ⚠️ Referenced in Appointment interface (line 88) but may not exist in DB |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |
| `cancelled_at` | TIMESTAMPTZ | |

**`appointment_services`** — junction table
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `appointment_id` | UUID FK → appointments | |
| `service_id` | UUID FK → services | Can be service or product |
| `order_index` | INTEGER | |
| `price_at_time` | DECIMAL(10,2) | Snapshot of price |
| `duration_at_time` | INTEGER | 0 for products |

**`clients`**
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `full_name` | VARCHAR(255) | |
| `email` | VARCHAR | |
| `phone` | VARCHAR(20) | |
| `address` | VARCHAR | (added via migration) |
| `birth_date` | DATE | |
| `gender` | VARCHAR(20) | |
| `allergies` | TEXT | |
| `preferences` | TEXT | |
| `terms_accepted` | BOOLEAN | |
| `terms_accepted_at` | TIMESTAMPTZ | |

### RPC Function: `create_appointment_with_services`

Location: `supabase/migrations/20241118_create_functions_triggers.sql`, lines 275-335

**Current signature** (does NOT include `professional_id`):
```sql
CREATE OR REPLACE FUNCTION public.create_appointment_with_services(
  p_client_id UUID,
  p_user_id UUID,
  p_appointment_date DATE,
  p_appointment_time TIME,
  p_status TEXT,
  p_notes TEXT,
  p_total_price DECIMAL,
  p_total_duration INTEGER,
  p_services JSONB
) RETURNS UUID
```

⚠️ **Important:** The `handleManualCreate` function passes `p_professional_id` to the RPC (line 2007), but the function signature does NOT accept it. The `professional_id` is set via a separate UPDATE or the fallback path handles it. This is a potential bug or the function was updated separately.

## What Needs to Change

Based on the ROADMAP requirement ("Organize manual booking into 'Agendamento Manual' and 'Venda Manual de Produtos'"), here is what needs to change:

### 1. UI Clarification (AdminDashboard.tsx, lines 4348-4585)
- **Already done:** The modal title dynamically changes based on `manualCategory`
- **Already done:** The toggle switches between "Agendamento" and "Produtos"
- **Potential improvement:** Make the two modes more visually distinct (different icons, colors, or even separate modals if UX demands)

### 2. Appointment List Differentiation (AdminDashboard.tsx, lines 2660-2733)
- Product-only appointments currently show the same as service appointments in the list
- Could add a badge/icon to distinguish "Venda" from "Agendamento" in the appointment list
- The `notes` field for product sales defaults to `"Venda de produtos (manual)"` — this can be used as a discriminator

### 3. Client Source Tracking
- **Current state:** The `Appointment` interface has `source?: string` (line 88) but it's never set
- **Missing:** No `source` column confirmed in the `appointments` table schema
- **Needed:** If we want to explicitly track "manual" vs "website" origin, a DB migration adding `source` column to `appointments` is needed

### 4. Stats/Dashboard
- `DashboardStats` component (imported on line 60) may need to differentiate between service revenue and product revenue
- The analytics tables (`create_analytics_tables.sql`) exist — check if they differentiate by category

### 5. Translation Keys
- `t('manualSale')` → "Venda Manual de Produtos" (line 4353)
- `t('manualBooking')` → "Agendamento Manual" (line 4353)
- `t('appointment')` → "Agendamento" (line 4374)
- `t('products')` → "Produtos" (line 4389)
- `t('selectProducts')` → "Selecionar Produtos" (line 4505)

## Common Pitfalls

### Pitfall 1: Product appointments still go through professional availability check
**What goes wrong:** If `manualCategory` is not correctly set before calling `handleManualCreate`, product sales may trigger unnecessary professional conflict checks.
**Why it happens:** The `isProduct` flag is derived from `manualCategory === 'product'` (line 1884), not from the actual selected items.
**How to avoid:** Ensure `manualCategory` is always set correctly before opening the modal. The existing code does this (lines 2715, 2738, 2912).
**Warning signs:** Product sales showing "no professional available" errors.

### Pitfall 2: `create_appointment_with_services` RPC signature mismatch
**What goes wrong:** The RPC call on line 2004 passes `p_professional_id` but the function signature (lines 275-285) does not include it.
**Why it happens:** The function was likely created before `professional_id` was added to appointments table.
**How to avoid:** The fallback path (lines 2041-2073) handles this by directly inserting into `appointments` with `professional_id`. But the RPC path may silently ignore the professional_id.
**Warning signs:** Product sales or manual bookings created without professional assignment even when one was selected.

### Pitfall 3: Stock not decremented in RPC path
**What goes wrong:** If the RPC succeeds, stock is decremented (lines 2017-2032). But if the RPC fails and falls back to direct insert, the stock decrement is in the fallback loop (lines 2066-2072). Both paths handle it, but the logic is duplicated.
**How to avoid:** Keep both paths in sync. Consider extracting stock decrement into a shared function.

### Pitfall 4: `source` field in Appointment interface but not in DB
**What goes wrong:** The `Appointment` interface declares `source?: string` (line 88) but the base schema doesn't have this column.
**Why it happens:** May have been added in a migration not in the tracked files, or was planned but never implemented.
**How to avoid:** Verify if `source` column exists in the actual Supabase database before relying on it.

## Code Examples

### Category Toggle (existing, lines 4361-4391)
```tsx
<div className="flex p-1 bg-gray-100 rounded-xl mb-6">
  <button
    onClick={() => {
      setManualCategory('service')
      setManualForm(prev => ({ ...prev, selectedServiceIds: [], time: '' }))
    }}
    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
      manualCategory === 'service' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    <Calendar className="w-4 h-4" />
    {t('appointment' as any) || 'Agendamento'}
  </button>
  <button
    onClick={() => {
      setManualCategory('product')
      setManualForm(prev => ({ ...prev, selectedServiceIds: [], time: '00:00' }))
      setManualProfessionalId(null)
    }}
    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
      manualCategory === 'product' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    <Package className="w-4 h-4" />
    {t('products' as any) || 'Produtos'}
  </button>
</div>
```

### handleManualCreate — Product Path (lines 1882-2079)
```typescript
const handleManualCreate = async () => {
  const { date, time, notes, selectedServiceIds } = manualForm
  const isProduct = manualCategory === 'product'

  // Validation — products skip time requirement
  if ((!selectedClient && !clientSearch) || !date || (!time && !isProduct) || selectedServiceIds.length === 0) {
    toast.error(isProduct ? 'Bitte Kunde, Datum e Produto selecionar' : '...')
    return
  }

  // ... client lookup/creation ...

  const totalPrice = svcList.reduce((sum, s) => sum + Number(applyPriceWithPromotions(s.price, s.id)), 0)
  const totalDuration = isProduct ? 0 : svcList.reduce((sum, s) => sum + Number(s.duration_minutes), 0)

  // Conflict check only for services
  if (!isProduct) {
    // ... professional availability check ...
  } else {
    finalProfessionalId = null
  }

  const finalTime = isProduct ? "00:00:00" : (time.length === 5 ? `${time}:00` : time)

  // Create via RPC or fallback
  const rpcRes = await supabase.rpc('create_appointment_with_services', { ... })

  // Stock update for products
  if (rpcRes.data && isProduct) {
    for (const product of svcList) {
      if (product.category === 'product') {
        const currentStock = product.stock || 0
        await supabase.from('services').update({ stock: Math.max(0, currentStock - 1) }).eq('id', product.id)
      }
    }
    fetchServices()
  }
}
```

### Modal Open Triggers (3 locations)
1. **List view button** (line 2736): `setManualCategory('service')` + open modal
2. **Week view button** (line 2910): `setManualCategory('service')` + open modal
3. **Edit appointment button** (line 2714): `setManualCategory('service')` + open modal

All three default to `'service'` category. There is no "New Sale" button — the admin must open the modal and switch to "Produtos" manually.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Services-only booking | Services + Products in same `services` table | Via `migration_add_demo_products.sql` | Products have `duration_minutes >= 0` (was `> 0`) |
| No stock tracking | `stock` column on services | Via `migration_add_stock_to_services.sql` | Stock decremented on product sale |
| No product weight | `weight` column on services | Via `migration_add_product_weight.sql` | Shipping calculation uses weight |
| No subcategories | `subcategory` column | Via `migration_add_subcategory.sql` | Services grouped by subcategory |
| No translations | `name_pt`, `name_de`, etc. | Via `migration_add_translation_columns.sql` | Multi-language support |

**Deprecated/outdated:**
- The `create_appointment_with_services` RPC function does not accept `professional_id` parameter, but the code passes it. This needs verification.
- The `source` field in the Appointment interface may not exist in the database.

## Open Questions

1. **Does the `appointments` table have a `source` column?**
   - What we know: The `Appointment` interface declares `source?: string` (line 88)
   - What's unclear: The base schema (`20241118_create_salon_schema.sql`) does not include it. No migration adds it in the tracked files.
   - Recommendation: Check actual Supabase database. If missing, add migration for `source` column to track "manual" vs "website" origin.

2. **Does the `appointments` table have a `professional_id` column?**
   - What we know: `migration_add_appointment_professional.sql` exists. The code uses `professional_id` extensively.
   - What's unclear: The exact column definition is not in tracked files.
   - Recommendation: Verify in Supabase dashboard.

3. **Is there a `professional_id` parameter in the actual `create_appointment_with_services` RPC?**
   - What we know: The tracked migration (line 275-285) does NOT include it. The code passes it (line 2007).
   - What's unclear: The function may have been updated directly in Supabase without a tracked migration.
   - Recommendation: Check actual Supabase function definition. If missing, update the RPC to accept `p_professional_id`.

4. **Should "Venda Manual de Produtos" be a separate modal or button?**
   - What we know: Currently it's a toggle within the same modal
   - What's unclear: Whether the user wants two separate entry points (e.g., "Novo Agendamento" button + "Nova Venda" button)
   - Recommendation: Keep the toggle but add a direct "Nova Venda" button that opens the modal pre-set to product category.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase | All data operations | ✓ | Cloud | — |
| Node.js | Dev server | ✓ | — | — |
| React 18 | UI rendering | ✓ | — | — |

**No missing dependencies.** This is a purely code-level refactor.

## Validation Architecture

> No `nyquist_validation` config found. Including section.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Not detected — no test config files found |
| Config file | none — see Wave 0 |
| Quick run command | N/A |
| Full suite command | N/A |

### Wave 0 Gaps
- [ ] No test framework detected (no `jest.config.*`, `vitest.config.*`, `pytest.ini`, etc.)
- [ ] No `test/` or `tests/` directory found
- [ ] Manual testing required: Open AdminDashboard → Appointments tab → Click "Novo Agendamento" → Verify toggle between "Agendamento" and "Produtos" works correctly

## Sources

### Primary (HIGH confidence)
- `src/pages/AdminDashboard.tsx` — Manual modal implementation (lines 205-210, 349-468, 1882-2079, 4348-4585)
- `src/components/BookingForm.tsx` — Client-side booking flow (lines 1-1491)
- `src/stores/bookingStore.ts` — Booking state management (lines 1-222)
- `supabase/migrations/20241118_create_salon_schema.sql` — Base database schema
- `supabase/migrations/20241118_create_functions_triggers.sql` — RPC function definition (lines 275-335)

### Secondary (MEDIUM confidence)
- `migration_add_stock_to_services.sql` — Stock column addition
- `migration_add_demo_products.sql` — Product constraint modification
- `migration_add_product_weight.sql` — Weight column addition
- `migration_add_subcategory.sql` — Subcategory column addition
- `migration_add_translation_columns.sql` — Translation columns
- `migration_add_appointment_professional.sql` — Professional ID on appointments

### Tertiary (LOW confidence)
- `.planning/ROADMAP.md` — Phase 08 requirement (line 43-44)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json and imports
- Architecture: HIGH — read all relevant source files
- Pitfalls: MEDIUM — identified from code analysis, not runtime testing
- Database schema: MEDIUM — based on tracked migrations; actual Supabase state may differ

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (30 days — stable codebase, no fast-moving dependencies)
