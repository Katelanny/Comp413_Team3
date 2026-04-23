# Frontend

## Table of Contents

- [Repo Structure](#repo-structure)
- [Installation](#installation)

## Repo Structure

```text
frontend/
├── app/                          # contains high level layout for each page
├── components/
│   ├── dashboard/                # contains file for each dahsboard logic and test case
│   └── Login.test.tsx            # test case file for Login page
│   └── Login.tsx                 # login Page logic
│   └── Logo.tsx                  # info for logo 
├── public/                       # contains images of logos used
└── test/
    └── jsonResponse.ts           # shared fetch mock helper for Vitest
```

## Installation
Navigate to the `frontend` directory and initialize your environment:

```bash
# Navigate to the frontend directory
cd frontend

# install npm to run the frontend
npm install 

# run command to get the frontend up
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Note: for local full-stack work, run the API on [http://localhost:5023](http://localhost:5023), or point the frontend at the hosted API below.

### API base URL configuration

The frontend reads the API base from **`NEXT_PUBLIC_API_BASE_URL`** (see `lib/api.ts`). If unset, it defaults to `http://localhost:5023`.

**Hosted backend (team):** `https://tbp-backend-134310339623.us-central1.run.app`

For local development:

```bash
cp .env.example .env.local
```

To use the hosted backend from your machine, set in `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=https://tbp-backend-134310339623.us-central1.run.app
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

In the Vercel project, set **Environment variable**:

- **Name:** `NEXT_PUBLIC_API_BASE_URL`
- **Value:** `https://tbp-backend-134310339623.us-central1.run.app`

Ensure the Cloud Run API allows **CORS** from your Vercel domain.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
