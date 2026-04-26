# how-to-use.md

## 1) Clone and open the project

```bash
git clone --recurse-submodules <your-repo-url>
cd Comp413_Team3
```

## 2) Quick demo links and accounts

### Live deployed app

- Frontend URL: `https://lesiontracker-eight.vercel.app/`
- Backend API URL: `https://tbp-backend-134310339623.us-central1.run.app`

### Login accounts for live demo

Use the corresponding role tab on the login screen:

- Doctor: `doctor` / `doctor`
- Admin: `admin` / `admin123`
- Patient with diagnosis access: `bfemalew010` / `patient1`
- Patient without diagnosis access: `wmalew090` / `patient1`

### Local seeded accounts (when running local backend)

- Patient: `patient1` / `patient1`, `patient2` / `patient2`
- Doctor: `doctor` / `doctor`
- Admin: `admin` / `admin123`

## 3) Run backend (.NET API)

From `TBPBackend/TBPBackend.Api`:

```bash
dotnet restore
dotnet run
```

Expected local endpoint:
- API base URL: `http://localhost:5023`

**Hosted backend (no local .NET required for UI demos):**  
`https://tbp-backend-134310339623.us-central1.run.app`

To point the frontend at Cloud Run, in `frontend/.env.local` set:

```bash
NEXT_PUBLIC_API_BASE_URL=https://tbp-backend-134310339623.us-central1.run.app
```

## 4) Run frontend (Next.js)

From `frontend`:

```bash
npm install
npm run dev
```

Expected local endpoint:
- Frontend URL: `http://localhost:3000`

## 5) Run frontend tests (Vitest)

From `frontend`:

```bash
npm run test
```

Expected result:
- Vitest reports passing test files and tests.

## 6) Run backend tests

From `TBPBackend`:

```bash
dotnet test
```

## 7) Optional: run ML service

From `ml`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r app/requirements.txt
pip install --no-build-isolation 'git+https://github.com/facebookresearch/detectron2.git'
uvicorn app.main:app
```

Expected endpoint:
- ML docs: `http://127.0.0.1:8000/docs`

## 8) Demonstration flow for TAs

**Option A — UI against hosted API:** set `NEXT_PUBLIC_API_BASE_URL` to the Cloud Run URL (see section 3), then start only the frontend.

**Option B — full stack locally:** start backend (`dotnet run`) and use default localhost API (or omit env).

1. Start frontend (`npm run dev`); optionally start local backend if not using Cloud Run.
2. Open `http://localhost:3000` (local) or the deployed Vercel URL.
3. Log in using the credentials listed in section 3.
4. Verify key role flows:
   - Doctor can view patient list and toggle diagnosis access.
   - Patient can view timeline/compare dashboard and profile info.
   - Admin can view system overview and user counts.
5. In compare mode, click lesion overlays and confirm popup fields render:
   - Lesion ID
   - Score
   - Location
   - Change
   - Previous lesion link (doctor view)
6. Run tests:
   - `frontend`: `npm run test`
   - `TBPBackend`: `dotnet test`

## 9) Troubleshooting

- If frontend fails to load data, verify `NEXT_PUBLIC_API_BASE_URL` matches the API you intend (local `http://localhost:5023` or Cloud Run URL above) and check the browser Network tab for CORS or 401 errors.
- If login fails on deployed frontend:
  - confirm correct role tab (Patient/Doctor/Admin)
  - confirm credentials from section 3
  - confirm Vercel env var `NEXT_PUBLIC_API_BASE_URL` points to Cloud Run
  - confirm backend has been redeployed after auth/CORS changes
- If ports are occupied, stop the prior process and restart.
- If node modules are missing or stale:
  - `rm -rf node_modules package-lock.json && npm install`

