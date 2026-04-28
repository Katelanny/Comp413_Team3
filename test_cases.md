# test_cases.md

## Test strategy



### Demo target URLs

- Deployed frontend: `https://lesiontracker-eight.vercel.app/`
- Hosted backend API: `https://tbp-backend-134310339623.us-central1.run.app`

---

## How to run automated tests

### Frontend

```bash
cd frontend
npm run test
```

### Backend

```bash
cd TBPBackend
dotnet test
```

### ML
```bash
cd ml
python -m pip install pytest pytest-cov
python -m pip install pytest-asyncio
python -m pip install pytest-mock
python -m pytest -v
```
---

## Backend test cases



---

## Frontend test cases 

### Login (`frontend/components/Login.test.tsx`)

1. Doctor login submits credentials to login endpoint and stores JWT.
2. Role mismatch shows user-facing error and does not store token.

### Doctor dashboard (`frontend/components/dashboard/DoctorDashboard.test.tsx`)

1. Loads doctor identity and sends dashboard request with Bearer token.
2. Renders sidebar patient list from API response.
3. Filters patient list by name/MRN.
4. Switching selected patient updates main panel data.
5. Diagnosis access toggle sends PATCH body `{ hasAccess: true }`.
6. Toggle error path displays server-provided error.

### Patient dashboard (`frontend/components/dashboard/PatientDashboard.test.tsx`)

1. Missing token shows `Not signed in.`.
2. Successful dashboard fetch shows patient identity and onboarding sections.
3. 401 dashboard response shows session-expired message.
4. Non-401 non-OK response shows generic dashboard error.
5. Profile metrics render (email, lesion count, photo count, diagnosis access).
6. Compare/Timeline button toggles update explanatory subtitle.
7. Photo-based view renders compare controls and timeline thumbnails.

### Admin dashboard (`frontend/components/dashboard/AdminDashboard.test.tsx`)

1. Loads admin overview datasets and resolves logged-in admin from JWT email.
2. API failure path renders admin error state.

---

## Screenshot-based checks 

From `frontend`:

```bash
npm run screenshot:install
npm run screenshot
npm run screenshot:doctor
npm run screenshot:patient
```

Generated images:

- `frontend/screenshot.png`
- `frontend/screenshot-doctor.png`
- `frontend/screenshot-patient.png`
