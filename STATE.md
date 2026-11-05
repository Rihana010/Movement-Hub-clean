# Repository State

Generated from the source tree on 2026-11-01. This document records what is
present in the repository. It does not claim that database-backed behavior was
runtime-tested.

## 1. Stack and versions

Source: [package.json](./package.json).

- Next.js `16.2.6`
- React `19.2.4`
- React DOM `19.2.4`
- TypeScript `^5`
- Prisma CLI/client/adapter-pg `^7.8.0`
- PostgreSQL driver `pg ^8.21.0`
- bcryptjs `^3.0.3`
- date-fns `^4.3.0`
- framer-motion `^12.40.0`
- lucide-react `^1.17.0`
- react-hook-form `^7.76.1` (declared; no source usage found)
- zod `^4.4.3` (declared; no source usage found)
- Tailwind CSS `^4`
- `@tailwindcss/postcss ^4`
- ESLint `^9`, `eslint-config-next 16.2.6`
- Font packages: `@fontsource-variable/big-shoulders-display ^5.3.0`,
  `@fontsource-variable/familjen-grotesk ^5.3.0`
- Package scripts: `dev`, `build`, `start`, `lint`
- Database provider: PostgreSQL, configured in [prisma/schema.prisma](./prisma/schema.prisma).
- Next build output identifies the application as using the App Router and a
  `proxy.ts` request proxy.

Validation observed:

- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- `npm run lint`: no errors at generation time; one warning for unused
  `formatRole` in [app/admin/users/page.tsx](./app/admin/users/page.tsx). That
  helper is no longer present in the source tree (checked 2026-11-05), so the
  warning is stale; lint has not been re-run since.
- No application integration tests are present in the source tree, so the
  statuses below are not runtime guarantees.

## 2. Pages and API endpoints

Status meanings: `working` means verified by static build/type validation only;
`stubbed` means the source is visibly incomplete; `broken` means a confirmed
failure; `unknown` means runtime behavior was not verified. No route was
classified as runtime-working because no database-backed integration test or
live request was run.

### Pages

| Path | Purpose | Status |
|---|---|---|
| `/` | Gateway for volunteer invite-link entry and admin email/password sign-in. | unknown |
| `/join/[code]` | Looks up an active event by private invite code and renders event details/sign-up form. | unknown |
| `/admin` | Authenticated dashboard showing upcoming scoped events, capacity, and signup totals. | unknown |
| `/admin/events` | Authenticated event list; also auto-archives past events before loading. | unknown |
| `/admin/events/new` | Client form for creating an event. | unknown |
| `/admin/events/[eventId]/edit` | Client form for loading/editing an event and assigning admins. | unknown |
| `/admin/events/[eventId]/volunteers` | Authenticated signup list, removal, and CSV export links. | unknown |
| `/admin/events/archive` | Authenticated archived-event list with restore/delete/export actions. | unknown |
| `/admin/users` | Super-admin-only admin-user list, role controls, and status controls. | unknown |
| `/admin/users/new` | Super-admin-only event-admin creation form; displays generated temporary password. | unknown |
| `/admin/change-password` | Authenticated password-change form. | unknown |
| `/_not-found` | Next.js generated not-found route. | unknown |

### API

| Method and path | Purpose | Status |
|---|---|---|
| `POST /api/volunteer-signups` | Validates invite/name/phone, locks the event row, checks capacity/duplicate phone, and creates a signup. | unknown |
| `POST /api/admin/login` | Checks admin password, active status, rate limit, and sets signed session cookie. | unknown |
| `POST /api/admin/logout` | Clears the signed session cookie and redirects to `/`. | unknown |
| `POST /api/admin/change-password` | Authenticated password verification and password-hash update. | unknown |
| `POST /api/admin/events` | Creates an event owned by the authenticated admin. | unknown |
| `GET /api/admin/events/[eventId]` | Returns a manageable event and its assignment rows. | unknown |
| `PUT /api/admin/events/[eventId]` | Updates manageable event fields. | unknown |
| `PATCH /api/admin/events/[eventId]` | Updates `isActive` for a manageable event. | unknown |
| `DELETE /api/admin/events/[eventId]` | Deletes a manageable event, its signups, and assignments in a transaction. | unknown |
| `PUT /api/admin/events/[eventId]/assign-admins` | Super-admin-only replacement of event-admin assignment rows. | unknown |
| `DELETE /api/admin/events/[eventId]/signups/[signupId]` | Deletes a signup only when its event and signup IDs match and the admin can manage the event. | unknown |
| `GET /api/admin/events/[eventId]/volunteers/export` | Returns scoped event signups as formula-escaped CSV. | unknown |
| `POST /api/admin/events/archive-past` | Archives all active events whose end date, or date without an end date, is before the current month. | unknown |
| `GET /api/admin/users` | Returns active event admins for assignment controls; requires an active signed-in admin. | unknown |
| `POST /api/admin/users` | Super-admin-only creation of an event-admin row with a generated temporary password. | unknown |
| `PATCH /api/admin/users/[adminId]/role` | Super-admin-only role update, with a guard against removing the only active super-admin role. | unknown |
| `PATCH /api/admin/users/[adminId]/role/status` | Super-admin-only active-status update; prevents self-deactivation. | unknown |
| `PATCH /api/admin/users/[adminId]/role/deactivate` | Super-admin-only deactivation; prevents self-deactivation. | unknown |

All `/admin/*` pages and `/api/admin/*` routes are matched by [proxy.ts](./proxy.ts:3).
The proxy allows login/logout through, verifies the signed cookie for other
admin requests, and redirects pages or returns `401` for admin APIs. Route
handlers additionally check that the admin row exists and, where applicable,
that it is active and authorized for the target event.

## 3. Data model

Authoritative current model: [prisma/schema.prisma](./prisma/schema.prisma).

### `Event`

- `id Int`: primary key, auto-increment.
- `title String`
- `date DateTime`
- `endDate DateTime?`
- `startTime String`
- `endTime String`
- `location String`
- `description String`
- `volunteerCapacity Int`
- `isActive Boolean`: defaults `true`.
- `inviteCode String`: unique.
- `createdAt DateTime`: defaults to now.
- `createdByAdminId Int?`: nullable foreign key to `AdminUser.id`.
- Relations: `createdByAdmin` (optional creator), `signups` (`VolunteerSignup[]`),
  `adminAssignments` (`EventAdminAssignment[]`).

### `EventAdminAssignment`

- `id Int`: primary key, auto-increment.
- `eventId Int`: foreign key to `Event.id`.
- `adminId Int`: foreign key to `AdminUser.id`.
- `createdAt DateTime`: defaults to now.
- Relations: `event`, `admin`.
- Composite unique constraint: `(eventId, adminId)`.

### `VolunteerSignup`

- `id Int`: primary key, auto-increment.
- `fullName String`
- `email String?`
- `phone String?`
- `locationOrDepartment String?`
- `status String`: defaults to `"confirmed"`.
- `selectedDates String[]`
- `createdAt DateTime`: defaults to now.
- `eventId Int`: foreign key to `Event.id`.
- Relation: `event`.

### `AdminUser`

- `id Int`: primary key, auto-increment.
- `email String`: unique.
- `fullName String?`
- `passwordHash String`
- `mustChangePassword Boolean`: defaults `true`.
- `role String`: defaults to `"event_admin"`.
- `isActive Boolean`: defaults `true`.
- `createdAt DateTime`: defaults to now.
- `updatedAt DateTime`: auto-updated.
- Relations: `createdEvents` (`Event[]`), `eventAssignments`
  (`EventAdminAssignment[]`).

Foreign-key delete behavior in the schema/migrations is restrictive for
signups and assignments; creator deletion sets `Event.createdByAdminId` to
null. Event deletion in the API explicitly deletes related signups and
assignments first.

## 4. Authentication flow, file by file

### Admin sign-in

1. The admin form is rendered by `AdminPanel` in
   [components/Gateway.tsx](./components/Gateway.tsx:135). Submit sends
   `{ email, password }` to `POST /api/admin/login`.
2. [app/api/admin/login/route.ts](./app/api/admin/login/route.ts:16) normalizes
   the email, applies an in-memory IP/email limiter, loads
   `AdminUser` by unique email, and compares `password` with
   `passwordHash` using bcrypt. An unknown email is compared with a dummy hash.
3. If valid and active, [lib/session.ts](./lib/session.ts:52) creates a
   base64url payload containing lower-case email and an eight-hour expiry, then
   signs it with HMAC-SHA256 using `SESSION_SECRET`.
4. The route sets the HTTP-only `ovp_session` cookie with same-site `lax`,
   root path, production-only `secure`, and an eight-hour `maxAge`.
5. [proxy.ts](./proxy.ts:10) verifies the cookie for `/admin/*` and
   `/api/admin/*`. [lib/adminAccess.ts](./lib/adminAccess.ts:9) additionally
   checks the corresponding `AdminUser.isActive` value.
6. [lib/currentAdmin.ts](./lib/currentAdmin.ts:7) loads the full admin row for
   protected server pages. Event authorization is computed by
   [lib/adminAccess.ts](./lib/adminAccess.ts:26): super admins get all events;
   event admins get events they created or were assigned.
7. The login response sends the browser to `/admin/change-password` when
   `mustChangePassword` is true; otherwise it sends the browser to `/admin`.

### First-password/change-password flow

1. [app/admin/change-password/page.tsx](./app/admin/change-password/page.tsx:13)
   checks client-side for at least eight characters and one special character,
   then posts `currentPassword` and `newPassword`.
2. [app/api/admin/change-password/route.ts](./app/api/admin/change-password/route.ts:6)
   obtains the active signed-in email, loads that `AdminUser` row, verifies
   the current hash, hashes the new password, and updates the same row's
   `passwordHash` and `mustChangePassword=false`.

### Volunteer sign-up flow

1. [components/JoinForm.tsx](./components/JoinForm.tsx:37) posts
   `inviteCode`, `fullName`, and `phone` to `POST /api/volunteer-signups`.
2. [app/api/volunteer-signups/route.ts](./app/api/volunteer-signups/route.ts:19)
   normalizes phone, finds the event by unique `inviteCode`, locks its row with
   `FOR UPDATE`, rejects inactive/full/duplicate-phone submissions, calculates
   all event days, and creates a `VolunteerSignup` row with
   `status="confirmed"` and the calculated `selectedDates`.
3. No volunteer authentication row or session is created.

### Admin/event form-to-row flows

- Event creation: [app/admin/events/new/page.tsx](./app/admin/events/new/page.tsx:24)
  posts form data to [app/api/admin/events/route.ts](./app/api/admin/events/route.ts:6).
  The API loads the signed-in `AdminUser` and creates an `Event` row with
  `createdByAdminId`, active status, and a generated unique invite code.
- Event edit/archive/delete: [app/admin/events/[eventId]/edit/page.tsx](./app/admin/events/[eventId]/edit/page.tsx:40)
  calls `GET`, `PUT`, and then assignment `PUT`; the event API updates the
  `Event` row and the assignment API replaces `EventAdminAssignment` rows.
  Archive/restore uses `PATCH`; deletion uses `DELETE`.
- Admin creation: [app/admin/users/new/page.tsx](./app/admin/users/new/page.tsx:18)
  posts name/email/`event_admin` to
  [app/api/admin/users/route.ts](./app/api/admin/users/route.ts:33). The API
  generates a temporary password, bcrypt-hashes it, and creates an
  `AdminUser` row with `mustChangePassword=true`.
- Logout: [app/api/admin/logout/route.ts](./app/api/admin/logout/route.ts:4)
  clears the cookie only; it does not change a database row.

## 5. TODOs, mocks, hardcoded values, and placeholders

### Explicit TODO/mock/stub markers

- No `TODO`, `FIXME`, `mock`, or `stub` code markers were found in
  application source, scripts, or Prisma source.
- README screenshot content is explicitly unfinished:
  [README.md](./README.md:69) says screenshots “will be added here.”

### User-facing placeholders

- Invite-link textarea: [components/Gateway.tsx](./components/Gateway.tsx:123) —
  `Paste it here. It looks like https://…/join/AbC123…`.
- Volunteer phone input: [components/JoinForm.tsx](./components/JoinForm.tsx:194) —
  `+91 98765 43210`.
- Admin email input: [app/admin/users/new/page.tsx](./app/admin/users/new/page.tsx:176) —
  `name@example.com`.

### Operational/business constants hardcoded in source

- Session lifetime: eight hours in [lib/session.ts](./lib/session.ts:10).
- Minimum session-secret length: 32 characters in [lib/session.ts](./lib/session.ts:17).
- Login limiter: 8 attempts per 15 minutes in [lib/rateLimit.ts](./lib/rateLimit.ts:4).
- Invite codes: 9 random bytes; accepted input length 8–64 in
  [lib/invite.ts](./lib/invite.ts:3) and [lib/inviteParse.ts](./lib/inviteParse.ts:7).
- Event form time choices: 48 half-hour choices in
  [app/admin/events/new/page.tsx](./app/admin/events/new/page.tsx:19) and
  [app/admin/events/[eventId]/edit/page.tsx](./app/admin/events/[eventId]/edit/page.tsx:7).
- Client event-day display cap: 60 days in
  [components/JoinForm.tsx](./components/JoinForm.tsx:20); server signup-day cap:
  366 days in [app/api/volunteer-signups/route.ts](./app/api/volunteer-signups/route.ts:9).
- Dashboard upcoming-event query limit: 6 and progress-bar limit: 36 in
  [app/admin/page.tsx](./app/admin/page.tsx:20).
- Temporary admin password: 12 characters from a literal character set in
  [app/api/admin/users/route.ts](./app/api/admin/users/route.ts:7).
- Password rules: at least 8 characters and one special character in
  [app/admin/change-password/page.tsx](./app/admin/change-password/page.tsx:19)
  and [app/api/admin/change-password/route.ts](./app/api/admin/change-password/route.ts:23).
- Bcrypt cost is hardcoded as `10` in login dummy-hash creation, password
  change, admin creation, and the create-admin script.
- Seed data contains four fixed demo event titles, dates, times, locations,
  descriptions, and capacities in [prisma/seed.ts](./prisma/seed.ts:11).
- Database bootstrap script hardcodes a PostgreSQL connection and database name
  in [scripts/create-database.ts](./scripts/create-database.ts:4).
- The create-admin usage text contains the example email and password wording
  in [scripts/create-admin.ts](./scripts/create-admin.ts:2).
- Development/example configuration contains local database addresses and blank
  public/secret settings in [.env.example](./.env.example:1); actual values
  are intentionally not reproduced here.

## 6. Environment variable names

Names referenced by source/configuration:

- `DATABASE_URL`
- `SESSION_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `NODE_ENV`

Only names are listed; no values are reproduced.

## 7. Five most likely broken things

These are ranked hypotheses from source inspection, not confirmed runtime
failures.

1. **Past-event auto-archive ignores event scope.**  
   [app/admin/events/page.tsx](./app/admin/events/page.tsx:39) calls
   `prisma.event.updateMany` with `isActive` and date predicates but no
   `eventScope(admin)`. Loading one event admin's event list can therefore
   archive past events belonging to other admins. This is the strongest
   authorization/data-integrity concern visible in the source.

2. **The archive API has no explicit admin/role check.**  
   [app/api/admin/events/archive-past/route.ts](./app/api/admin/events/archive-past/route.ts:4)
   relies on the global proxy only, then archives all matching events. Any
   active signed-in admin can invoke it, and the operation is not restricted to
   a super admin or scoped to the caller.

3. **Database bootstrap naming does not match the configured database naming.**  
   [scripts/create-database.ts](./scripts/create-database.ts:5) connects to a
   hardcoded local PostgreSQL database and creates `open_volunteer_platform`,
   while [.env.example](./.env.example:1) and the checked-in local `.env`
   reference different database names. Running the bootstrap script does not
   demonstrably create the database the application uses.

4. **Existing signup rows may not have `selectedDates`.**  
   [prisma/migrations/20260609155920_add_multiday_signup_dates/migration.sql](./prisma/migrations/20260609155920_add_multiday_signup_dates/migration.sql:2)
   adds `selectedDates` without a default or `NOT NULL`, while the current
   Prisma model requires `String[]`. The admin page assumes
   `signup.selectedDates.length` exists at
   [app/admin/events/[eventId]/volunteers/page.tsx](./app/admin/events/[eventId]/volunteers/page.tsx:104).
   Whether this affects the current database depends on migration/data state and
   was not runtime-verified.

5. **Assignment updates are not validated before replacing rows.**  
   [app/api/admin/events/[eventId]/assign-admins/route.ts](./app/api/admin/events/[eventId]/assign-admins/route.ts:42)
   accepts numeric IDs, deletes all existing assignments, then calls
   `createMany` without verifying that the event exists or that each ID is an
   active event admin. Invalid IDs can produce a database error after deletion;
   valid super-admin/inactive-admin IDs can be assigned despite the UI wording.

