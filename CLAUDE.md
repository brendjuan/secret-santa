# Secret Santa Exchange - Project Guide

## Project Overview

A web application for creating and managing Secret Santa gift exchanges. Users can initialize exchanges, manage participants, set constraints, and securely view assignments.

### Core Features

1. **Exchange Creation & Management**
   - Initialize a new Secret Santa exchange
   - Generate unique modification link (full admin access)
   - Generate unique view/share link (participant access)

2. **Admin Capabilities (via modification link)**
   - Add/remove participants
   - Set cost constraints
   - Configure random seed for reproducible assignments
   - View all participants and their assignments once generated
   - Regenerate assignments

3. **Participant Access (via view/share link)**
   - View all participants in the exchange
   - Enter unique password to view their assigned person
   - Can only see their own assignment (not others)

## Tech Stack

### Core Framework
- **SvelteKit** (v2.48.5): Full-stack web framework with file-based routing
- **Svelte** (v5.43.8): Reactive UI framework with runes-based state management
- **TypeScript** (v5.9.3): Strict type checking enabled
- **Vite** (v7.2.2): Build tool and dev server

### Database & ORM
- **Drizzle ORM** (v0.44.7): Type-safe SQL query builder
- **@libsql/client** (v0.15.15): SQLite client (libSQL)
- **Schema**: `src/lib/server/db/schema.ts`
- **Database**: SQLite file at `local.db`

### Styling
- **Tailwind CSS** (v4.1.17): Utility-first CSS framework
- **@tailwindcss/forms** (v0.5.10): Form styling plugin
- **@tailwindcss/typography** (v0.5.19): Typography plugin
- **@tailwindcss/vite** (v4.1.17): Vite integration

### Authentication & Security
- **@oslojs/crypto** (v1.0.1): Cryptographic utilities (SHA-256 hashing)
- **@oslojs/encoding** (v1.1.0): Base64url and hex encoding
- Custom session-based auth in `src/lib/server/auth.ts`

### Development Tools
- **ESLint** (v9.39.1): Code linting with TypeScript and Svelte plugins
- **Prettier** (v3.6.2): Code formatting with Svelte and Tailwind plugins
- **svelte-check** (v4.3.4): Type checking for Svelte files

### Deployment
- **@sveltejs/adapter-vercel**: Configured for Vercel deployment
- Automatic deployment on git push when connected to Vercel project

## Project Structure

```
secret-santa/
├── src/
│   ├── routes/              # SvelteKit file-based routes
│   │   ├── +layout.svelte   # Root layout
│   │   ├── +page.svelte     # Home page
│   │   └── layout.css       # Global styles
│   ├── lib/
│   │   ├── server/          # Server-only code
│   │   │   ├── db/
│   │   │   │   ├── schema.ts    # Drizzle schema definitions
│   │   │   │   └── index.ts     # Database client
│   │   │   └── auth.ts      # Session management utilities
│   │   ├── assets/          # Static assets (favicon, etc.)
│   │   └── index.ts         # Public library exports
│   ├── hooks.server.ts      # SvelteKit server hooks
│   └── app.html             # HTML template
├── static/                  # Static files served at root
├── drizzle.config.ts        # Drizzle Kit configuration
├── svelte.config.js         # SvelteKit configuration
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── .env                     # Environment variables
```

## Key Conventions

### Database Schema
- Use Drizzle ORM with SQLite dialect
- Schema defined in `src/lib/server/db/schema.ts`
- Table naming: lowercase singular (e.g., `user`, `session`)
- Export type inference: `typeof table.$inferSelect`

### Authentication
- Session-based authentication using SHA-256 hashed tokens
- 30-day session expiration with 15-day renewal window
- Cookie name: `auth-session`
- Session utilities in `src/lib/server/auth.ts`

### Server-Only Code
- All database and auth code in `src/lib/server/*`
- Never import server code directly in client components
- Use `+page.server.ts` or `+server.ts` for API endpoints

### Routing
- File-based routing: `src/routes/[path]/+page.svelte`
- Data loading: `+page.server.ts` (server) or `+page.ts` (universal)
- API routes: `+server.ts` files
- Layouts: `+layout.svelte` files

### Styling
- Tailwind CSS utility classes
- Global styles in `src/routes/layout.css`
- Svelte scoped styles with `<style>` tags when needed

### Type Safety
- Strict TypeScript enabled
- Infer types from Drizzle schema
- Use SvelteKit's generated types (`.svelte-kit/tsconfig.json`)

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run check
npm run check:watch    # Watch mode

# Linting & formatting
npm run lint           # Check formatting and lint
npm run format         # Auto-format code

# Database operations
npm run db:push        # Push schema changes to database
npm run db:generate    # Generate migration files
npm run db:migrate     # Run migrations
npm run db:studio      # Open Drizzle Studio GUI

# Note: drizzle-kit push can hang on slow database connections
# If push hangs, use one of these alternatives:
yes | npm run db:push          # Auto-confirm interactive prompts
npx drizzle-kit push --force   # Force push without confirmation
```

## Database Schema Design

### Implemented Tables

1. **exchanges**
   - `id`: Unique exchange identifier (text)
   - `name`: Exchange name (text, required)
   - `slug`: URL-safe slug with unique suffix (text, required, unique) - used in participant view URLs
   - `adminToken`: Secret token for modification link (text, unique)
   - `viewToken`: Secret token for view/share link (text, unique) - deprecated in favor of slug
   - `theme`: Optional exchange theme (text, nullable)
   - `costMax`: Optional maximum cost constraint (text, nullable)
   - `randomSeed`: Optional seed for reproducible random assignments (text, nullable)
   - `isGenerated`: Boolean flag if assignments have been generated (boolean, default false)
   - `createdAt`: Timestamp (timestamp, default now)

2. **participants**
   - `id`: Unique participant identifier (text)
   - `exchangeId`: Foreign key to exchanges (text, cascades on delete)
   - `name`: Participant name (text, required)
   - `passwordHash`: Hashed password for viewing assignment (text, required)
   - `assignedTo`: Foreign key to another participant (text, nullable until generated)

### Schema Notes
- Use text IDs generated with nanoid or similar
- Hash passwords with SHA-256 before storage
- Use foreign keys with cascade on delete for data integrity
- Index tokens for fast lookup

## Security Considerations

1. **Token Generation**
   - Use cryptographically secure random tokens for admin/view links
   - Encode with base64url for URL-safe tokens
   - Never expose tokens in logs or error messages

2. **Password Handling**
   - Hash participant passwords with SHA-256 minimum
   - Salt passwords if storing long-term
   - Never return passwords in API responses

3. **Access Control**
   - Validate admin token before allowing modifications
   - Validate view token + participant password before showing assignment
   - Prevent enumeration attacks on participant passwords

4. **Assignment Algorithm**
   - Use seeded random for reproducibility when seed provided
   - Validate no self-assignments
   - Handle edge cases (1 participant, circular dependencies)

## Implementation Notes

### Current State
- ✅ SvelteKit project configured with TypeScript
- ✅ Drizzle ORM configured with PostgreSQL
- ✅ Tailwind CSS configured and styled
- ✅ ESLint and Prettier configured
- ✅ Database schema implemented (exchanges and participants tables)
- ✅ Exchange creation route (`/`) with name, theme, costMax, and randomSeed
- ✅ Admin view route (`/exchange/[adminToken]`) for managing participants
- ✅ Participant view route (`/view/[slug]`) with name-based URLs
- ✅ Assignment generation algorithm with seeded random support
- ✅ Form validation and error handling
- ✅ Password-protected assignment viewing

### Features Implemented
- Exchange creation with customizable name, theme, and cost constraints
- URL-friendly slugs for participant links (e.g., `/view/christmas-2025-abc123`)
- Admin can add/remove participants before generating assignments
- Circular assignment generation (0→1→2→...→n→0)
- Seeded random for reproducible assignments
- Password-protected individual assignment viewing
- Clean, responsive UI with Tailwind CSS

### Known Issues
- Auth utilities in `src/lib/server/auth.ts` exist but are not currently used
- Database push can hang on slow connections (see workarounds in Development Commands)

## Environment Variables

Required in `.env`:
```bash
DATABASE_URL=file:local.db
```

## Testing Considerations

- Test assignment algorithm with various participant counts
- Test edge cases: 1 participant, 2 participants, 100+ participants
- Verify no self-assignments
- Test seeded random reproducibility
- Test token generation uniqueness
- Test password validation
- Test access control (unauthorized access attempts)

## Deployment Notes

### Vercel Deployment

The project is configured for Vercel using `@sveltejs/adapter-vercel`.

**Setup Steps:**
1. Connect repository to Vercel project
2. Set environment variables in Vercel dashboard:
   - `DATABASE_URL`: SQLite file path or Turso connection string
3. Deploy automatically on git push

**Database Considerations:**
- SQLite file storage (`file:local.db`) won't persist on Vercel serverless functions
- **Recommended**: Use [Turso](https://turso.tech/) (libSQL cloud) for production
  - Free tier available
  - Compatible with existing `@libsql/client` code
  - Set `DATABASE_URL` to Turso connection string: `libsql://[database].turso.io`
  - Add `DATABASE_AUTH_TOKEN` environment variable for authentication
- Alternative: Migrate to PostgreSQL with `drizzle-orm/postgres-js`

**Production Security:**
- Set secure cookie options in production (httpOnly, secure, sameSite)
- Ensure all secrets are stored in Vercel environment variables
- Enable CORS restrictions if needed

**Build Configuration:**
- Build command: `npm run build` (automatic)
- Output directory: `.vercel/output` (automatic)
- Node.js runtime: `nodejs20.x` (configured in `svelte.config.js`)
- Adapter automatically configures Vercel serverless functions

**Local Development:**
- Project configured to use Node.js 20.x runtime on Vercel
- Local development works with any Node version, but build requires explicit runtime config
- Vercel deployment will use Node 20 regardless of local version
