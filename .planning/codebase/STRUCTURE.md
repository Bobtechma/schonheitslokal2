# Directory Structure

```
e:\programação\sys igrejinha\
├── backend/ # API server logic
│   ├── src/
│   │   ├── app.ts        # Entry point configuring Express and middleware
│   │   ├── db/           # Drizzle ORM schemas, clients, and migrations
│   │   ├── middleware/   # Express middleware (Auth, error handling, etc)
│   │   ├── routes/       # API endpoints definitions
│   │   ├── services/     # Business logic and DB queries
│   │   └── types/        # Global TypeScript types
│   ├── package.json      # Backend dependencies and scripts
│   └── tsconfig.json     # Backend Typescript
├── frontend-vite/ # Main Single Page React Application
│   ├── src/
│   │   ├── assets/       # Static assets (images, icons)
│   │   ├── components/   # Reusable UI components
│   │   ├── lib/          # Utilities, configuration, api clients (e.g., axios config)
│   │   ├── pages/        # Route components (e.g., Dashboard, Login)
│   │   ├── main.tsx      # React entry point, DOM attachment
│   │   ├── App.tsx       # Main App component mapping routes
│   │   ├── App.css       # App-specific layout styles
│   │   └── index.css     # Global styles including Tailwind configuration
│   ├── package.json      # Frontend dependencies and scripts
│   ├── vite.config.ts    # Vite bundler configuration
│   └── tsconfig.json     # Frontend TypeScript types
├── frontend_flutter/ # Secondary frontend (mobile)
│   ├── lib/          # Dart codebase
│   └── pubspec.yaml  # Flutter dependencies
├── .agent/               # Agent configuration and AI skills
├── .planning/            # Project planning context
└── README.md             # High level document outlining the overall project
```

## Naming Conventions
- Backend files are likely descriptive `camelCase.ts` or `kebab-case.ts`.
- Frontend React components use `PascalCase.tsx` while utilities are `camelCase.ts`.
- Styles generally utilize Tailwind classes rather than individual `camelCase.css` files, apart from the core `index.css/App.css`.
