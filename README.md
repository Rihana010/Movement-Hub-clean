# Movement Hub

A private, link-based volunteer coordination platform for movements, built for Problem 3 "The Movement".

![License](https://img.shields.io/badge/License-MIT-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791)

**Live demo:** https://movement-hub-clean.vercel.app

**Result:** Team HAC LABS placed top 6 out of 30 teams.

## The problem

Movements run on WhatsApp, but WhatsApp has no sign-up tracking, no capacity limits, and no accountability. Public event pages expose sensitive causes to spam and trolls. Movement Hub keeps the channel people already use and adds structure on top.

## What it does

**Volunteers**
- Sign in with Google
- Open a mission through its private invite link (`/join/<code>`)
- Sign up with just a name and phone number
- View the Heat Map of where help is needed

**Organizers**
- Super Admin and Event Admin roles
- Create, edit, archive, and restore events
- Share events via WhatsApp or copy link
- View and export signup lists
- Manage administrator accounts

**Private by default:** there is no public event list. An event is reachable only through its invite code.

We extended and reworked it for this project: Google OAuth for volunteers, the Heat Map, the invite-only access model, WhatsApp sharing, and transaction-based capacity protection.

## Security design

- Role-based access: Event Admins can only see and manage events they created or were assigned
- Admin sessions use HMAC-signed cookies
- Forced password change on first admin login
- Google sign-in never grants admin access (separate auth paths)
- Minimal data collection from volunteers
- Capacity checks run inside database transactions, so concurrent signups cannot overbook an event

## Tech stack

Next.js, React, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Supabase (Google OAuth), Leaflet, Vercel

## Getting started

```bash
git clone https://github.com/Rihana010/Movement-Hub-clean.git
cd Movement-Hub-clean
npm install
cp .env.example .env
npx prisma migrate deploy
npx prisma generate
npx tsx scripts/create-admin.ts you@example.com "your password" "Your Name"
npm run dev
```

Open http://localhost:3000. Set `SESSION_SECRET` and `NEXT_PUBLIC_SITE_URL` in `.env`.

## Roadmap

- Append-only audit log of admin actions
- Rate limiting on join endpoints
- Expiring and revocable invite codes
- Phone verification (OTP) and encryption of stored phone numbers
- 2FA for admins
- Volunteer skill and location matching

## Team

| Name | Role |
|------|------|
| Rihana | Full-Stack Lead: architecture, auth and access model, backend |
| charanraj  | Frontend & UX: UI, Heat Map, volunteer flow |
| ashmar | Product & Security/QA: problem research, testing, pitch and demo |

## License

Released under the MIT License. See [LICENSE](LICENSE).

This project is built on [Symplapp/open-volunteer-platform](https://github.com/Symplapp/open-volunteer-platform), which states in its README that it is released under the MIT License. Its repository did not include a copyright notice in its LICENSE file, so none is reproduced here. The copyright line in [LICENSE](LICENSE) covers the changes made by this team.
