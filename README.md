# Gym Dashboard (Next.js + Vercel + Postgres)

Cast-friendly multi-user gym dashboard with:
- user selector front page
- personalized dashboard per user
- Google Sheets or template workout plans
- clock + weather + Spotify now playing
- rest timer + workout calendar
- admin panel for adding and configuring users

## Stack
- Next.js App Router + TypeScript + Tailwind
- Drizzle ORM + PostgreSQL
- Spotify OAuth (per-user accounts)
- Open-Meteo weather API

## Environment Variables
Copy `.env.example` to `.env.local` and fill values:

```bash
cp .env.example .env.local
```

Required:
- `DATABASE_URL`
- `ADMIN_PASSCODE`
- `SESSION_SECRET`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI`
- `TOKEN_ENCRYPTION_KEY`

## Local Setup
```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Then open `http://localhost:3000`.

## Default Seeded Users
- `Vishy` (Google Sheet workout source prewired)
- `Emily` (template source)
- `Guest` (template source)

## Scripts
- `npm run dev` - start development server
- `npm run build` - production build
- `npm run lint` - run ESLint
- `npm run test` - run unit tests (Vitest)
- `npm run test:e2e` - run Playwright smoke test
- `npm run db:generate` - generate Drizzle migration files
- `npm run db:migrate` - apply migrations
- `npm run db:seed` - seed starter users and workout sources

## Vercel Deployment
1. Push to GitHub.
2. Import repo into Vercel.
3. Configure environment variables in Vercel Project Settings.
4. Run migrations against your production DB.
5. Deploy.
