# Architecture

## System Overview
The application follows a standard Client-Server Architecture.
- **Client**: `frontend-vite/` (Vite, React, TailwindCSS). A Single Page Application (SPA) providing an interactive user interface.
- **Server**: `backend/` (Node.js, Express, TypeScript). A RESTful API serving data to the clients.
- **Database**: PostgreSQL database. Accessed via the backend application.

## Abstractions & Layers (Backend)
- **API/Routes Layer**: Defined in `backend/src/routes/`. Handles incoming HTTP requests and structures the responses. Uses Express routers.
- **Middleware**: Located in `backend/src/middleware/`. Handles concerns such as authentication (JWT), file uploads (`multer`), validation, and CORS.
- **Business Logic Layer**: `backend/src/services/`. Contains the core business logic, encapsulating database interaction mapping logic. 
- **Data Access Layer**: `backend/src/db/`. Defined via Drizzle ORM schemas to interact directly with the PostgreSQL database.
- **Types/Interfaces**: Global types defined in `backend/src/types/` for strong static typing.

## Abstractions & Layers (Frontend)
- **Pages/Views**: Located in `frontend-vite/src/pages/`. Major route components responsible for rendering full-screen views.
- **Components**: `frontend-vite/src/components/`. Reusable UI components. Likely follows atomic design principles (buttons, forms, layout elements).
- **Core Configurations and Context**: `App.tsx` and `main.tsx` act as the entry points, initializing global providers (like routers or state contexts).
- **Libraries/Utils**: `frontend-vite/src/lib/`. Typically contains API client configurations (e.g., Axios instances) and shared utility functions.
- **Assets**: `frontend-vite/src/assets/`. Static files like images, icons, or global styles.

## Data Flow
1. User interacts with the UI (React components).
2. The UI triggers a programmatic or navigational change, requesting data via Axios client (usually configured in `lib/`).
3. The Express backend receives the request at a `routes` endpoint.
4. Express middleware validates or authenticates the request.
5. Control is passed to a `service`, which utilizes Drizzle ORM to query/mutate PostgreSQL data.
6. The `service` formats the data and returns it to the `route`.
7. The Express backend responds to the React frontend with a JSON payload.
8. The React frontend consumes the JSON payload, updates local state, and triggers a re-render.
