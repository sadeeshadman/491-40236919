# Constein Group Website  

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=sadeeshadman_Constein&metric=alert_status&token=ef37aa31fe298bc71bafa0919c300a7001b67544)](https://sonarcloud.io/summary/new_code?id=sadeeshadman_Constein) [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=sadeeshadman_Constein&metric=code_smells&token=ef37aa31fe298bc71bafa0919c300a7001b67544)](https://sonarcloud.io/summary/new_code?id=sadeeshadman_Constein) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=sadeeshadman_Constein&metric=coverage&token=ef37aa31fe298bc71bafa0919c300a7001b67544)](https://sonarcloud.io/summary/new_code?id=sadeeshadman_Constein) [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=sadeeshadman_Constein&metric=duplicated_lines_density&token=ef37aa31fe298bc71bafa0919c300a7001b67544)](https://sonarcloud.io/summary/new_code?id=sadeeshadman_Constein) 

## Project Summary   
Constein is a property-services platform that combines a public marketing website with operational tools for inspection reporting. The site presents four service areas, supports quote requests, and includes a protected inspector workflow for creating, editing, finalizing, and exporting inspection reports.

Mockup of the application: https://scene-vital-65436099.figma.site

Project wiki: https://github.com/sadeeshadman/491-40236919/wiki

## Project Overview

This repository is a monorepo with two applications:

- `apps/frontend`: Next.js frontend for the public website, authentication, service pages, quote flows, and inspector-facing report pages.
- `apps/backend`: Express API for quotes, inspections, canned comments, image uploads, PDF generation, and health checks.

## Project In Brief

- Public users can browse service offerings for home inspection, property management, construction services, and engineering consulting.
- Visitors can submit quote requests from the landing page or service-specific quote forms.
- Inspectors and admins can sign in and use the report generator to create draft reports, add findings, attach images, finalize reports, and download PDFs.
- Inspection reports are stored in MongoDB and support a draft/finalized lifecycle with a short revert window after finalization.
- Image uploads are handled through Cloudinary, and quote notification emails are sent through SMTP when configured.

## Tech Stack

- Frontend: Next.js, React, TypeScript, NextAuth
- Backend: Express, TypeScript, Mongoose, Zod
- Database: MongoDB
- File/media integration: Cloudinary
- Email integration: Nodemailer / SMTP
- PDF generation: Puppeteer with PDFKit fallback

## Quick Start For A New Developer

These steps assume you just cloned the repository and want the project running locally.

### 1. Clone the repository

```bash
git clone https://github.com/sadeeshadman/491-40236919.git
cd 491-40236919
```

### 2. Install dependencies

Install all workspace dependencies from the repo root:

```bash
npm ci
```

### 3. Create local environment files

Copy the example environment files into working local files:

```bash
npm run setup:env
```

This creates:

- `apps/backend/.env`
- `apps/frontend/.env.local`

### 4. Review the required environment variables

Minimum values for local development are already populated in the example files, but you should still review them.

Frontend file: `apps/frontend/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
BACKEND_URL=http://localhost:4000
AUTH_SECRET=replace-with-a-long-random-secret
MONGODB_URI=mongodb://admin:admin123@localhost:27018/constein?authSource=admin
MONGODB_DB_NAME=constein
```

Backend file: `apps/backend/.env`

```bash
MONGODB_URI=mongodb://admin:admin123@localhost:27018/constein?authSource=admin
QUOTE_INBOX_EMAIL=shadmansadee@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL="Constein Group <your-email@gmail.com>"

# Cloudinary (required for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Notes:

- `AUTH_SECRET` should be replaced with a long random string before you rely on auth locally.
- SMTP is optional if you only want the app to run. Quote requests still save to MongoDB even if email is not configured.
- Cloudinary is only required if you want finding image uploads in the report generator.

### 5. Start MongoDB with Docker

This project expects MongoDB to be running locally on port `27018`.

```bash
docker compose up -d mongodb
```

The container uses these defaults:

- Host port: `27018`
- Database name used by the app: `constein`
- Username: `admin`
- Password: `admin123`

### 6. Start the application

Run both frontend and backend together from the repo root:

```bash
npm run dev
```

This starts:

- Frontend on `http://localhost:3000`
- Backend on `http://localhost:4000`

### 7. Open the app

Open the frontend in your browser:

```text
http://localhost:3000
```

The frontend proxies most `/api/*` requests to the Express backend. NextAuth routes stay on the frontend app.

## Running The Apps Separately

If you want to run each app in its own terminal:

```bash
npm run dev:frontend
npm run dev:backend
```

## Authentication Notes

- Public pages and quote requests work without signing in.
- The report generator is protected and only available to users with role `employee` or `admin`.
- Those users must exist in the MongoDB `Users` collection.
- Passwords are validated against stored password hashes, so a valid user record is required if you want to test inspector login.

## Optional Setup For Full Feature Testing

### Seed canned comments for the report generator

If you want canned comments available in inspection findings:

```bash
npx tsx apps/backend/src/scripts/seed-comments.ts
```

### Enable quote emails

Set valid SMTP values in `apps/backend/.env`.

For Gmail, use an App Password instead of your normal account password.

### Enable finding image uploads

Set valid Cloudinary credentials in `apps/backend/.env`.

## Checks And Validation

Run all checks:

```bash
npm run check
```

Run checks individually:

```bash
npm run check:frontend
npm run check:backend
npm run test:integration
```
