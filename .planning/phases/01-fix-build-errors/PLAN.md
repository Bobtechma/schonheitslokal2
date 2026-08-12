# GSD Phase 01 - Fix Build Errors

## Overview
The Vercel deployment is failing due to strict build checks. We have 48 ESLint errors (mostly `no-explicit-any`) and 1 TypeScript error (unused import in `ActivityManager.tsx`).

## Proposed Changes

### [Frontend] fix-build-errors
#### [MODIFY] [App.tsx](file:///e:/programação/sys igrejinha/frontend-vite/src/App.tsx)
- Fix `react-hooks/set-state-in-effect` by moving state initialization or using a defensive check.
- Remove redundant setStates inside Effect.

#### [MODIFY] [ActivityManager.tsx](file:///e:/programação/sys igrejinha/frontend-vite/src/components/ActivityManager.tsx)
- [DELETE] `ActivityRole` unused import.
- Replace `any` types with `Activity`, `User`, or `unknown`.

#### [MODIFY] [Dashboard.tsx](file:///e:/programação/sys igrejinha/frontend-vite/src/components/Dashboard.tsx)
- Replace `any` with domain types.

#### [MODIFY] [TransactionForm.tsx](file:///e:/programação/sys igrejinha/frontend-vite/src/components/Finance/TransactionForm.tsx)
- Clean up `any` leftovers from previous refactor.

#### [MODIFY] [MemberForm.tsx](file:///e:/programação/sys igrejinha/frontend-vite/src/components/Members/MemberForm.tsx)
- Batch fix `any` types to align with `types/index.ts`.

## Verification Plan
### Automated Tests
- `npm run lint` in `frontend-vite` must pass.
- `npm run build` in `frontend-vite` must pass.
- `npx tsc --noEmit` must return 0 errors.

### Manual Verification
- Verify that the app still loads correctly and state management (user login) is intact.
