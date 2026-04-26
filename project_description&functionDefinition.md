# project_description&functionDefinition.md

## Project description

This project is a longitudinal skin-lesion tracking platform for Total Body Photography (TBP). It provides:

- A **doctor workflow** to review patients, compare images over time, and control diagnosis visibility for patient portal access.
- A **patient workflow** to view personal progress, timeline/compare photos, and lesion-related summaries.
- An **admin workflow** for high-level operational metrics and user overviews.
- A backend API for authentication, dashboard data, and domain operations.

The live deployed frontend used for demonstration is:
- `https://lesiontracker-eight.vercel.app/`

## Core architecture

- `frontend/`: Next.js + React dashboards and UI tests.
- `TBPBackend/`: ASP.NET Core API, auth, data access, and backend tests.
- `ml/`: FastAPI ML inference service and lesion/pose pipeline.

## Primary classes/modules by layer

### Frontend (Next.js / React)

- `app/page.tsx`: root login/register page composition.
- `app/doctor/page.tsx`, `app/patient/page.tsx`, `app/admin/page.tsx`: route entrypoints for role dashboards.
- `components/Login.tsx`: login form, role validation, token storage, redirects.
- `components/Register.tsx`: registration-oriented UI shell.
- `components/dashboard/DoctorDashboard.tsx`: doctor workflow orchestration.
- `components/dashboard/PatientDashboard.tsx`: patient timeline/compare and lesion popup flow.
- `components/dashboard/AdminDashboard.tsx`: admin overview and list endpoints.
- `components/dashboard/InPlaceZoomViewport.tsx`: reusable synchronized zoom/pan image viewport with lesion polygon click support.
- `lib/api.ts`: API base URL and URL builder helper.

### Backend (ASP.NET Core)

- `Program.cs`: service registration, JWT auth, CORS policy, middleware pipeline, migration+seed on startup.
- `Controllers/*.cs`: HTTP API surface (`Account`, `Doctor`, `Patient`, `Admin`, `Images`, `Prediction`).
- `Service/*.cs`: business logic (`AuthService`, `ImageService`, `PredictionService`, `TokenService`).
- `Repository/*.cs`: data access abstraction (`AccountRepo`, `ImageRepository`, `PredictionRepository`).
- `Data/ApplicationDbContext.cs`: EF Core DbContext.
- `Data/SeedData.cs`: role/user/patient/doctor/admin/lesion/image/visit seed logic.
- `Dtos/*`: request/response contracts, including ML prediction DTOs with stable serialized field names.

## Key frontend components and responsibilities

### `frontend/components/Login.tsx`
- Authenticates users with `POST /api/account/login`.
- Validates selected role vs backend-returned role.
- Stores JWT token and redirects to role dashboard.

### `frontend/components/dashboard/DoctorDashboard.tsx`
- Loads doctor identity and assigned patients.
- Supports patient search/filter.
- Loads selected patient details and visit images.
- Enables diagnosis-access toggle persisted via:
  - `PATCH /api/doctor/patients/{patientId}/diagnosis-access`

### `frontend/components/dashboard/PatientDashboard.tsx`
- Loads patient dashboard data from `GET /api/patient/dashboard`.
- Supports compare and timeline photo modes.
- Displays profile metrics and diagnosis access state.

### `frontend/components/dashboard/AdminDashboard.tsx`
- Loads patient/doctor/admin lists.
- Derives signed-in admin identity from JWT payload.
- Displays system health and overview cards.

### `frontend/components/dashboard/InPlaceZoomViewport.tsx`
- Shared zoom/pan viewport used by dashboard image comparisons.
- Supports synchronized behavior in compare mode.

## Key backend endpoints (high-level)

- `POST /api/account/login`: login + JWT issuance.
- `POST /api/account/logout`: logout endpoint used by dashboards.
- `GET /api/doctor/dashboard`: doctor summary + patient list.
- `GET /api/doctor/patients/{id}`: doctor-side patient visit/lesion details.
- `PATCH /api/doctor/patients/{id}/diagnosis-access`: toggle patient diagnosis visibility.
- `GET /api/patient/dashboard`: patient summary/dashboard data.
- `GET /api/patient/{id}`: patient profile details.
- `GET /api/admin`, `GET /api/doctor`, `GET /api/patient`: admin aggregate views.