# Integrations

## Database
- **PostgreSQL**: Serving as the primary relational database for the backend applications. Accessed via Drizzle ORM.

## Authentication
- **Local Authentication**: Handled internally using `bcrypt` for password hashing and `jsonwebtoken` for stateless session management (JWT). No external identity providers (like Auth0, Firebase Auth, or OAuth providers) appear to be configured natively off the shelf.

## File Storage
- **Local Storage**: `multer` is used for handling `multipart/form-data`, primarily for uploading files. 

## External APIs and Services
Based on the current package structure, no distinct external SAAS integrations (e.g., Stripe, SendGrid, Twilio) are explicitly declared in the core dependencies. Data ingestion and third-party Webhook integrations would be handled internally within the Node.js API.
