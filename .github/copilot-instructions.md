# Secret Santa - AI Coding Instructions

## Project Overview
Secret Santa web app for managing gift exchanges. Users join via unique codes; admins create events, manage participants, and trigger random assignments. When complete, participants see their secret recipient.

## Tech Stack & Architecture
- **Framework**: Next.js 14+ with App Router (TypeScript)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Azure Static Web Apps
- **Auth Pattern**: URL-based secret codes (no traditional auth system)

## Database Schema (Supabase)
Create tables with these relationships:
- `secret_santas`: `id`, `name` (**UNIQUE**), `status` (PENDING/COMPLETED), `created_at`
- `participants`: `id`, `secret_santa_id` (FK), `name` (unique within secret_santa), `access_code` (VARCHAR human-readable format), `assigned_to_id` (nullable FK to participants.id), `has_accessed` (boolean)

**Constraints**:
- Secret Santa names must be **globally unique** (cannot create two Secret Santa with same name)
- Participant names must be unique within the same Secret Santa
- Minimum 2 participants, maximum 20 per Secret Santa
- `access_code` format: `{secret_santa_name}-{8_random_digits}`
- CASCADE DELETE: deleting a Secret Santa automatically deletes all its participants

## Key Architectural Decisions

### Authentication Model
- **Admin access**: Via secret URL stored in environment variable
  - Add `ADMIN_SECRET_PATH` to `.env.local` (e.g., `my-secret-admin-url-12345`)
  - Admin dashboard accessible at `/admin/{ADMIN_SECRET_PATH}`
  - Without correct secret path, no admin features are accessible
- **Participant access**: Via unique code entry (stored in session/localStorage)
  - Participant codes must be **human-readable**: `{secret_santa_name}-{8_digit_random_number}` (e.g., `NataleUfficio-87654321`)
  - Store the full code in DB for validation, display formatted for easy sharing
  - Once a participant enters their code, store it in **localStorage** to persist across sessions
  - On return visits from same device, auto-authenticate without requiring code re-entry
- **No password system**: Security through secret URL (admin) and readable codes (participants)

### API Route Structure (Next.js App Router)
Place API routes in `app/api/`:
- `POST /api/secret-santa` - Create new event with participants (requires admin auth, validates 2-20 participants, unique name)
- `GET /api/secret-santa` - List all Secret Santas (requires admin auth)
- `GET /api/secret-santa/[id]` - Get event details (requires access validation)
- `DELETE /api/secret-santa/[id]` - Delete Secret Santa and all participants (requires admin auth, irreversible)
- `POST /api/secret-santa/[id]/complete` - Trigger random assignment algorithm (requires admin auth)
- `POST /api/secret-santa/[id]/participant` - Add new participant (only in PENDING status, requires admin auth)
- `POST /api/secret-santa/[id]/regenerate-codes` - Regenerate all participant codes (requires admin auth)
- `POST /api/secret-santa/[id]/participant/[participantId]/regenerate-code` - Regenerate code for single participant (requires admin auth)
- `DELETE /api/secret-santa/[id]/participant/[participantId]` - Remove participant (requires admin auth)
- `POST /api/verify-code` - Validate participant access code

**Admin Authentication**: All admin endpoints validate the secret path from request headers or session

### Random Assignment Algorithm
When admin triggers the completion (after all participants have registered):
1. Shuffle participants array
2. Assign each participant to the next (circular: last → first)
3. Validate no self-assignments
4. Update `assigned_to_id` in database atomically (use Supabase transaction)
5. Set status to COMPLETED

### State Management Pattern
- Status transitions: `PENDING` → `COMPLETED` (one-way, irreversible)
- A Secret Santa stays PENDING until admin manually triggers completion via `/complete` endpoint
- Admin should trigger completion only after all participants have registered
- **In PENDING status**: Admin can add/remove participants and regenerate codes
- **In COMPLETED status**: Participant list is locked, no modifications allowed
- Use Supabase RLS (Row Level Security) if needed for additional data protection

## UI/UX Conventions
- **Admin dashboard**: List view of all Secret Santas with status badges
- **Participant view**: Code entry → Status display → (when COMPLETED) Recipient name reveal
- **Design**: Minimal, festive (Christmas theme), mobile-friendly
- Use Server Components where possible; Client Components only for interactive forms

## Environment Variables
Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_SECRET_PATH=my-secret-admin-url-12345
```

## Development Workflow
- `npm run dev` - Start development server
- `npm run build` - Production build
- Use Supabase CLI for local database development: `npx supabase start`
- Deploy to Azure Static Web Apps via GitHub Actions

## Code Style Preferences
- Use TypeScript strict mode
- Async/await over promises chains
- Server Actions for form submissions where appropriate
- Descriptive variable names in Italian comments if clarifying business logic