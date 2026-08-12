# Concerns

## Technical Debt & Known Issues
- **Testing Coverage**: As noted in `TESTING.md`, there is a significant lack of automated testing (Unit, Integration, E2E) across both the backend API and frontend Vite applications. This poses a risk for regressions during iterative development.
- **Error Handling**: The backend error handling could benefit from a centralized, explicitly typed error-handling middleware to avoid repetitive `try/catch` and ensure consistent API responses.
- **Frontend State Management**: Without exploring the full depth of the React components, reliance on prop-drilling or localized state for complex data flows might become a bottleneck. Adoption of Context API, Zustand, or Redux should be monitored if complexity increases.
- **Authentication Resilience**: Ensure the JWT implementation accurately checks for expiration and enforces secure transmission (HttpOnly cookies if applicable, rather than `localStorage` for sensitive tokens).

## System Fragility
- **Database Migrations**: `drizzle-kit` is used. Managing schema changes in production requires careful tracking of migration files to prevent data loss.
- **Monorepo Complexity**: The repository houses three separate projects (`backend`, `frontend-vite`, `frontend_flutter`). Maintaining synchronized dependencies, coordinated running scripts, and shared types (if any) could become cumbersome without a dedicated monorepo manager (e.g., Turborepo, Nx, or Yarn Workspaces). 

## Security Posture
- Validate that Cross-Origin Resource Sharing (CORS) is strictly configured in production to only allow the canonical frontend domains.
- Confirm password hashing with `bcrypt` uses an adequate and secure salt rounding mechanism.
- Enforce strict validation on all incoming Drizzle ORM queries to prevent potential injection vectors (though ORMs generally mitigate this, edge cases in raw queries or complex `where` clauses exist).
