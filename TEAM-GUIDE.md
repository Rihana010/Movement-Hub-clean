# Team guide

## Run it locally
1. `npm install`
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL` and `SESSION_SECRET`
   (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
3. `npx prisma migrate deploy` then `npx prisma generate`
4. Create the super admin: `npx tsx scripts/create-admin.ts you@example.com "password" "Your Name"`
5. `npm run dev`, open http://localhost:3000

## Super-admin recovery

Email recovery is not configured. To reset the password for an existing
`super_admin` without printing or logging the password, enter it at the
PowerShell prompt and pipe it to the private recovery script:

```powershell
$password = Read-Host "New password"
$password | npx tsx scripts/reset-super-admin.ts you@example.com
Remove-Variable password
```

The script will not create or promote accounts. It resets only an existing
active or inactive `super_admin` and invalidates that account's existing
sessions.

## How it works
- `/` gateway: Volunteer tab (paste WhatsApp link) and Admin tab (sign in).
- `/join/<inviteCode>` private event page; volunteers give name + phone only.
- `/admin/*` dashboard, events, signups, admins (super admin only).
- Super admin sees everything; event admins see only events they created or were assigned to.
- Admins share an event with the WhatsApp or Copy link buttons. Set `NEXT_PUBLIC_SITE_URL` once deployed.

## Where things live
- `lib/session.ts` signed session cookie. `lib/adminAccess.ts` who may touch which event.
- `app/api/volunteer-signups` public sign-up. `app/api/admin/**` admin-only (guarded by `proxy.ts` and the access helpers).
- `components/JoinForm.tsx`, `Gateway.tsx`, `ShareEventButton.tsx`. Styles and design tokens in `app/globals.css`.
- `prisma/schema.prisma` and `prisma/migrations`.

## Rules
- Never commit `.env` or put a secret in code.
- Work on a branch, open a pull request, don't push to `main`.
