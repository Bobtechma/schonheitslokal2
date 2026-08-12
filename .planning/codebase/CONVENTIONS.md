# Conventions

## General Coding Style
- **Strict Typing**: TypeScript is heavily utilized across both `backend` and `frontend-vite`. Strict mode is likely enabled.
- **Linting & Formatting**: 
  - `frontend-vite` utilizes ESLint v9 (`eslint.config.js` or similar configuration) with `@eslint/js` and `typescript-eslint`.
  - Typical React conventions (Hooks, functional components) are enforced via `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`.
- **Naming Constraints**:
  - React Components: `PascalCase.tsx`.
  - Backend Routes and Services: `kebab-case.ts` or `camelCase.ts` depending on the file logic.
  - Types/Interfaces: Often prefixed or explicitly segregated into a `types/` directory.

## Error Handling
- **Backend Error Handling**: Handled via Express middleware. Errors should ideally be typed and caught asynchronously (using standard try/catch blocks wrapped in async route handlers or via a dedicated async handler wrapper).
- **Frontend Error Handling**: Handled via Axios interceptors or local component state (e.g., standard `try/catch` on API calls and displaying toast/alert notifications).

## Styling (Frontend)
- Tailwind CSS v4 is used exclusively.
- Utility classes are favored over custom CSS, with `clsx` and `tailwind-merge` used to dynamically construct class names.
- A centralized `index.css` is used for global Tailwind directives and potentially custom design tokens.

## Git Workflow
- Standard descriptive commit messages are expected.
- Feature branching and PR-based reviews are typically employed in mature states, guided by the GSD (Get Shit Done) CLI context if present.
