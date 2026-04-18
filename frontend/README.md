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
    └── jsonResponse.ta           # test case file
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

Note: backend should be running on [http://localhost:5023](http://localhost:5023)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
