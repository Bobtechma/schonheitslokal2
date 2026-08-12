# Tech Stack

## General
- **Project Structure**: Monorepo split between `backend`, `frontend-vite`, and `frontend_flutter`.
- **Primary Languages**: TypeScript, HTML, CSS (TailwindCSS)
- **Database**: PostgreSQL

## Backend (`backend/`)
- **Runtime Environment**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript (`tsx` for dev, `tsc` for build)
- **Database ORM**: Drizzle ORM (`drizzle-kit` for migrations/studio)
- **Database Driver**: `pg`, `postgres`, `sql.js`
- **Authentication/Security**: `jsonwebtoken` (JWT), `bcrypt` (password hashing), `cors`
- **Utilities**: `multer` (file uploads), `date-fns` (date handling), `uuid`, `dotenv`

## Frontend Web (`frontend-vite/`)
- **Build Tool**: Vite
- **Framework**: React 19
- **Routing**: React Router DOM (v7)
- **Styling**: Tailwind CSS v4, `clsx`, `tailwind-merge`
- **UI Components & Icons**: Lucide React
- **Animations**: Framer Motion
- **Data Visualization**: Recharts
- **HTTP Client**: Axios
- **Utilities**: `browser-image-compression`
- **Static Code Analysis**: ESLint

## Frontend Mobile (`frontend_flutter/`)
- **Framework**: Flutter
- **Language**: Dart
