# TBPBackend API

This is a .NET 10 REST API for the Total Body Photography (TBP) platform. It handles user authentication, patient/doctor management, image metadata, and ML-based skin lesion prediction results.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Running Locally](#running-locally)
3. [Project Structure](#project-structure)
4. [Authentication & Authorization](#authentication--authorization)
5. [Database Tables](#database-tables)
6. [API Endpoints](#api-endpoints)
7. [DTOs (Request & Response Shapes)](#dtos-request--response-shapes)
8. [Seed Data (Test Accounts)](#seed-data-test-accounts)

---

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | .NET 10, ASP.NET Core |
| Database | PostgreSQL via [Neon](https://neon.tech) |
| ORM | Entity Framework Core 10 |
| Authentication | ASP.NET Core Identity + JWT Bearer tokens |
| Image Storage | Google Cloud Storage |
| API Docs | Swagger / OpenAPI (Swashbuckle) |

---

## Running Locally

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- Access to the Neon PostgreSQL database (credentials already in `appsettings.Development.json`)
- Google Cloud CLI (`gcloud`) authenticated with application default credentials

### 1. Authenticate with Google Cloud

The backend generates signed GCS URLs to serve patient images. It needs your Google credentials to do so:

```bash
gcloud auth application-default login
```

### 2. Start the API

```bash
cd TBPBackend/TBPBackend.Api
dotnet run
```

The API starts at `https://localhost:5321` by default.

### 3. View API Docs

Navigate to:
```
https://localhost:5321/swagger
```

Swagger shows every endpoint, lets you authenticate with a JWT, and lets you send test requests directly in the browser.

### 4. Applying Database Migrations

Migrations run automatically on startup. If you add a new model and need to create a new migration manually:

```bash
cd TBPBackend/TBPBackend.Api
dotnet ef migrations add <MigrationName>
dotnet ef database update
```

### Configuration

All local config lives in `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=...;Username=...;Database=neondb;Ssl Mode=Require"
  },
  "Jwt": {
    "Issuer": "https://localhost:5321/",
    "Audience": "https://localhost:5321/",
    "SecretKey": "..."
  }
}
```

---

## Project Structure

```
TBPBackend.Api/
├── Controllers/         # HTTP endpoints — receive requests, return responses
├── Service/             # Business logic — orchestrates data and transformations
├── Repository/          # Database access — all EF Core queries live here
├── Interfaces/          # Contracts for services and repositories (for DI)
├── Models/
│   ├── Tables/          # EF Core entity classes (one per DB table)
│   └── AppUser.cs       # Identity user model
├── Dtos/                # Request/response shapes (organized by domain)
│   ├── Account/
│   ├── Admin/
│   ├── Dashboard/
│   ├── Doctor/
│   ├── Patient/
│   └── Prediction/
├── Data/
│   ├── ApplicationDbContext.cs   # EF Core DbContext (registers all tables)
│   └── SeedData.cs               # Creates test users/patients/doctors on startup
├── Migrations/          # Auto-generated EF migration files
├── Program.cs           # App startup, service registration, middleware pipeline
├── appsettings.json
└── appsettings.Development.json
```

### How a request flows through the app

```
HTTP Request
    ↓
Controller        (validates auth, calls service, returns HTTP response)
    ↓
Service           (business logic, maps models to DTOs)
    ↓
Repository        (queries the database via EF Core)
    ↓
ApplicationDbContext → PostgreSQL (Neon)
```

Every layer talks to the one below it through an interface (e.g. `IImageService`, `IImageRepository`). This makes each layer independently testable.

---

## Authentication & Authorization

### How login works

1. Client sends `POST /api/account/login` with username + password.
2. The API verifies credentials against ASP.NET Identity.
3. On success, it returns a **short-lived JWT access token** in the response body and sets an **HTTP-only refresh token cookie**.
4. The client includes the JWT in the `Authorization: Bearer <token>` header for all protected requests.
5. When the JWT expires, the client calls `POST /api/account/refresh` — the refresh cookie is sent automatically and a new JWT is returned.

### Roles

Every user has exactly one role: `Patient`, `Doctor`, or `Admin`.

### Authorization policies

| Policy | Who can access |
|---|---|
| `PatientOnly` | Patients only |
| `DoctorOnly` | Doctors only |
| `AdminOnly` | Admins only |
| `MedicalStaff` | Doctors **and** Admins |

These policies are applied per-endpoint with `[Authorize(Policy = "...")]`.

### Doctor-patient access control

Doctors can only access data for patients **they have a Visit record with**. Endpoints that return patient-specific data check:

```csharp
var hasVisit = await _db.Visits.AnyAsync(v =>
    v.DoctorId == doctor.Id && v.PatientId == patientId);
if (!hasVisit) return Forbid();
```

If a doctor tries to access a patient they are not assigned to, they get a `403 Forbidden`.

---

## Database Tables

### AppUser
The core identity record. Extends ASP.NET Identity's `IdentityUser`.

| Column | Type | Notes |
|---|---|---|
| Id | string (GUID) | Primary key |
| UserName | string | Used for login |
| Email | string | |
| PasswordHash | string | Hashed by Identity |
| TestField | bool | Internal flag |

Every `Patient`, `Doctor`, and `Admin` row links back to an `AppUser` via `AppUserId`.

---

### Patient

| Column | Type | Notes |
|---|---|---|
| Id | long | Primary key |
| AppUserId | string | FK → AppUser |
| FirstName | string | |
| LastName | string | |
| Email | string | |
| Phone | string | |
| Gender | string | |
| DateOfBirth | string | |
| HasAccessToDiagnosis | bool | Controls whether patient can see diagnosis notes |
| CreatedAtUtc | DateTime | |
| UpdatedAtUtc | DateTime | |
| LastLoginAtUtc | DateTime | |

---

### Doctor

| Column | Type | Notes |
|---|---|---|
| Id | long | Primary key |
| AppUserId | string | FK → AppUser |
| FirstName | string | |
| LastName | string | |
| Email | string | |
| CreatedAtUtc | DateTime | |
| LastLoginAtUtc | DateTime | |

---

### Admin

| Column | Type | Notes |
|---|---|---|
| Id | long | Primary key |
| AppUserId | string | FK → AppUser |
| FirstName | string | |
| LastName | string | |
| Email | string | |
| CreatedAtUtc | DateTime | |
| LastLoginAtUtc | DateTime | |

---

### Visits

Tracks which doctor saw which patient and when. This is what controls doctor-patient access.

| Column | Type | Notes |
|---|---|---|
| Id | long | Primary key |
| PatientId | long | FK → Patient |
| DoctorId | long | FK → Doctor |
| VisitDate | DateTime | |
| VisitNotes | string | Doctor's notes from the visit |

---

### Lesion

A clinical-level record of lesions for a patient. Created/managed by doctors or admins. This is separate from the ML detection output (see `ImagePrediction` and `LesionDetection` below).

| Column | Type | Notes |
|---|---|---|
| Id | long | Primary key |
| PatientId | long | FK → Patient |
| AnatomicalSite | string | e.g. "Left forearm" |
| Diagnosis | string? | e.g. "Basal cell carcinoma" |
| NumberOfLesions | int | Count at this site |
| DateRecorded | DateTime | |
| CreatedAtUtc | DateTime | |

---

### UserImage

Metadata for a patient image stored in Google Cloud Storage.

| Column | Type | Notes |
|---|---|---|
| Id | long | Primary key |
| AppUserId | string | FK → AppUser (the patient) |
| FileName | string | GCS object path, e.g. `WFemaleW010/T1/342_WFemale.png` |
| ModelName | string? | Body model identifier, e.g. `WFemale` |
| ImageIndex | int? | Index within model series |
| Count | int? | Total images in series |
| CameraAngle | string? | e.g. `Front`, `Back`, `Side` |
| Height | int? | Pixels |
| Width | int? | Pixels |
| CreatedAtUtc | DateTime | Acts as the image timestamp |

Images are stored in GCS. `FileName` is the object path within the bucket. The API generates short-lived signed URLs on demand so clients can load images without needing GCS credentials.

---

### ImagePrediction

One row per ML prediction run on an image. Created by the Python ingestion script (`scripts/run_patient_predictions.py`).

| Column | Type | Notes |
|---|---|---|
| Id | long | Primary key |
| UserImageId | long | FK → UserImage |
| NumLesions | int | Total lesions detected |
| CreatedAtUtc | DateTime | When the prediction was run |

---

### LesionDetection

One row per individual lesion detected in an image. Each row belongs to an `ImagePrediction`.

| Column | Type | Notes |
|---|---|---|
| Id | long | Primary key |
| ImagePredictionId | long | FK → ImagePrediction |
| LesionId | string | `"{img_id}_{index}"` e.g. `178_0` |
| BoxX1, BoxY1, BoxX2, BoxY2 | float | Bounding box in pixel coordinates |
| Score | float | Confidence score (0.0 – 1.0) |
| PolygonMask | string | JSON-serialized `float[][]` — polygon contours |
| AnatomicalSite | string? | Predicted body location |
| PrevLesionId | string? | Matched lesion from the previous timepoint |
| RelativeSizeChange | float? | Size change vs previous (e.g. `0.2` = +20%) |
| CreatedAtUtc | DateTime | |

---

### RefreshToken

Stores hashed refresh tokens for JWT rotation.

| Column | Type | Notes |
|---|---|---|
| Id | long | Primary key |
| TokenHash | string | SHA-256 hash of the raw token |
| AppUserId | string | FK → AppUser |
| CreatedAtUtc | DateTime | |
| ExpiresAtUtc | DateTime | |
| RevokedAtUtc | DateTime? | Set on logout or rotation |

---

## API Endpoints

All endpoints are prefixed with `/api`. Use Swagger at `/swagger` to test them interactively.

---

### Account — `/api/account`

No authorization required.

#### `POST /api/account/login`
Log in with username and password. Returns a JWT and sets a refresh token cookie.

**Request:**
```json
{ "username": "doctor", "password": "doctor" }
```
**Response:**
```json
{ "token": "<jwt>", "role": "Doctor", "username": "doctor" }
```

---

#### `POST /api/account/register`
Create a new user account.

**Request:**
```json
{ "username": "newuser", "password": "pass123", "email": "user@example.com", "role": "Patient" }
```
**Response:** Same shape as login — returns a JWT immediately.

---

#### `POST /api/account/refresh`
Exchange the `refresh_token` cookie for a new JWT. No request body needed — the cookie is sent automatically by the browser.

**Response:** Same shape as login.

---

#### `POST /api/account/logout`
Revokes the refresh token cookie.

---

### Doctor — `/api/doctor`

All endpoints require a **Doctor** JWT unless noted.

#### `GET /api/doctor/dashboard`
Returns the doctor's profile and a summary list of their assigned patients.

**Response:**
```json
{
  "firstName": "Sarah",
  "lastName": "Chen",
  "email": "doctor@tbp.com",
  "patients": [
    { "patientId": 1, "firstName": "Alice", "lastName": "Johnson", "email": "...", "lastVisitDate": "..." }
  ]
}
```

---

#### `GET /api/doctor/patients/{patientId}`
Returns full detail for a specific patient including images and lesion records.
Returns `403` if the doctor has no visit with this patient.

**Response:**
```json
{
  "patientId": 1,
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "...",
  "images": [{ "fileName": "...", "url": "<signed-gcs-url>", "cameraAngle": "Front", ... }],
  "lesions": [{ "id": 1, "anatomicalSite": "Left forearm", "diagnosis": "...", "numberOfLesions": 2, "dateRecorded": "..." }]
}
```

---

#### `GET /api/doctor/patients/{patientId}/images`
Returns just the image IDs and signed GCS URLs for a patient.
Returns `403` if the doctor has no visit with this patient.

**Response:**
```json
[
  { "imageId": 178, "url": "<signed-gcs-url>", "cameraAngle": "Back", "createdAtUtc": "2026-01-15T00:00:00Z" }
]
```

---

#### `PATCH /api/doctor/patients/{patientId}/diagnosis-access`
Grants or revokes the patient's ability to see their own diagnosis notes.

**Request:**
```json
{ "hasAccess": true }
```

---

#### `GET /api/doctor` — requires `MedicalStaff`
Returns all doctors in the system.

#### `GET /api/doctor/{id}` — requires `MedicalStaff`
Returns a single doctor by ID.

---

### Patient — `/api/patient`

#### `GET /api/patient/dashboard` — requires `PatientOnly`
Returns the logged-in patient's profile, images (with signed URLs), and lesion records.

If `HasAccessToDiagnosis` is `false`, diagnosis fields are hidden from lesion data.

---

#### `GET /api/patient/doctor-notes` — requires `PatientOnly`
Returns visit notes from doctors. Only works if `HasAccessToDiagnosis` is `true` — returns `403` otherwise.

**Response:**
```json
[
  { "visitId": 1, "visitDate": "...", "doctorFirstName": "Sarah", "doctorLastName": "Chen", "visitNotes": "Initial screening." }
]
```

---

#### `GET /api/patient` — requires `MedicalStaff`
Returns all patients in the system.

#### `GET /api/patient/{id}` — requires `MedicalStaff`
Returns a single patient by ID.

---

### Images — `/api/images`

Requires a valid JWT (any role).

#### `GET /api/images`
Returns image metadata for the currently logged-in user.

#### `POST /api/images/link`
Links existing GCS filenames to the current user's account.

**Request:**
```json
{ "filenames": ["WFemaleW010/T1/342_WFemale.png"] }
```

#### `POST /api/images/link-with-metadata`
Links images with full metadata (camera angle, dimensions, etc.).

---

### Prediction — `/api/prediction`

Requires **Doctor** role.

#### `GET /api/prediction/{imageId}`
Returns the most recent ML prediction result for an image. The response shape exactly matches the ML service's `PredictResponse` format.

**Response:**
```json
{
  "patient_id": "c3066a59-...",
  "predictions": [
    {
      "img_id": "178",
      "timestamp": "2026-01-15T00:00:00Z",
      "num_lesions": 46,
      "lesions": [
        {
          "lesion_id": "178_0",
          "box": { "x1": 412.5, "y1": 300.1, "x2": 430.2, "y2": 318.7 },
          "score": 0.991,
          "polygon_mask": [[412.0, 301.0, 429.0, 301.0, 429.0, 317.0, 412.0, 317.0]],
          "anatomical_site": null,
          "prev_lesion_id": null,
          "relative_size_change": null
        }
      ]
    }
  ],
  "errors": []
}
```

---

### Admin — `/api/admin`

Requires **Admin** role.

#### `GET /api/admin/dashboard`
Returns a summary of all users and recent activity across the platform.

#### `GET /api/admin`
Returns all admin accounts.

#### `GET /api/admin/{id}`
Returns a single admin by ID.

---

## DTOs (Request & Response Shapes)

### Account

| DTO | Fields |
|---|---|
| `LoginDto` | `username`, `password` |
| `RegisterDto` | `username`, `password`, `email`, `role?` |
| `AuthResponseDto` | `token`, `role?`, `username?` |

### Patient info

| DTO | Fields |
|---|---|
| `PatientInfoDto` | `id`, `firstName`, `lastName`, `email`, `phone`, `gender`, `dateOfBirth`, `hasAccessToDiagnosis`, `createdAtUtc`, `updatedAtUtc`, `lastLoginAtUtc` |
| `PatientDashboardDto` | `firstName`, `lastName`, `email`, `hasAccessToDiagnosis`, `images[]`, `lesions[]` |
| `DoctorNoteDto` | `visitId`, `visitDate`, `doctorFirstName`, `doctorLastName`, `visitNotes` |

### Doctor info

| DTO | Fields |
|---|---|
| `DoctorInfoDto` | `id`, `firstName`, `lastName`, `email`, `createdAtUtc`, `lastLoginAtUtc` |
| `DoctorDashboardDto` | `firstName`, `lastName`, `email`, `patients[]` |
| `DoctorPatientSummaryDto` | `patientId`, `firstName`, `lastName`, `email`, `lastVisitDate?` |
| `DoctorPatientDetailDto` | `patientId`, `firstName`, `lastName`, `email`, `images[]`, `lesions[]` |
| `PatientImageDto` | `imageId`, `url`, `cameraAngle?`, `createdAtUtc` |
| `SetDiagnosisAccessDto` | `hasAccess` |

### Shared sub-DTOs

| DTO | Fields |
|---|---|
| `ImageInfoDto` | `fileName`, `url`, `modelName?`, `index?`, `count?`, `cameraAngle?`, `height?`, `width?`, `dateTaken` |
| `LesionInfoDto` | `id`, `anatomicalSite`, `diagnosis?`, `numberOfLesions`, `dateRecorded` |

### Prediction (snake_case to match ML service)

| DTO | JSON fields |
|---|---|
| `PredictionResponseDto` | `patient_id`, `predictions[]`, `errors[]` |
| `ImagePredictionDto` | `img_id`, `timestamp`, `num_lesions`, `lesions[]` |
| `LesionDto` | `lesion_id`, `box`, `score`, `polygon_mask`, `anatomical_site?`, `prev_lesion_id?`, `relative_size_change?` |
| `BoundingBoxDto` | `x1`, `y1`, `x2`, `y2` |

---

## Seed Data (Test Accounts)

On startup, `SeedData.InitializeAsync()` creates the following test accounts if they don't already exist. Use these to test locally.

| Username | Password | Role | Notes |
|---|---|---|---|
| `patient1` | `patient1` | Patient | Has diagnosis access enabled |
| `patient2` | `patient2` | Patient | Diagnosis access disabled |
| `doctor` | `doctor` | Doctor | Assigned to both test patients |
| `admin` | `admin123` | Admin | |

The seed also creates:
- Sample lesion records for both patients
- Sample `UserImage` rows linked to GCS filenames
- Sample `Visits` linking the doctor to both patients
