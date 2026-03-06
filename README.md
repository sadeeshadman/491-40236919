# Constein Monorepo

Mockup of the application: https://scene-vital-65436099.figma.site

This repository is split into separate frontend and backend apps:

## Getting Started

- `apps/frontend`: Next.js UI app.
- `apps/backend`: Express + Mongoose API service.

## Local setup

Install dependencies from the repo root:

```bash
npm ci
```

Create local env files from templates:

```bash
npm run setup:env
```

Optional: edit local values in `apps/backend/.env` and `apps/frontend/.env.local`.

To enable quote-request emails, set these in `apps/backend/.env`:

```bash
QUOTE_INBOX_EMAIL=shadmansadee@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL="Constein Group <your-email@gmail.com>"
```

For Gmail, use an App Password (not your account password).

Start MongoDB:

```bash
docker compose up -d mongodb
```

Run the full app in one terminal:

```bash
npm run dev
```

Run apps independently (optional):

```bash
npm run dev:frontend
npm run dev:backend
```

## Checks

Run checks independently:

```bash
npm run check:frontend
npm run check:backend
npm run test:integration
```

Run both:

```bash
npm run check
```

## API base URL

- Backend default port: `4000`
- Frontend default port: `3000`

Set these in `apps/frontend/.env.local` when the frontend consumes backend APIs:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
BACKEND_URL=http://localhost:4000
```

Frontend requests to `/api/*` are proxied to the backend via `apps/frontend/next.config.ts`.
Use the shared helper in `apps/frontend/src/lib/api.ts` for API calls.
