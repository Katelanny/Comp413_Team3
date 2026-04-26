# requirements&dependencies.md

## System requirements

- Node.js 20+
- npm 10+
- .NET SDK 10.0
- Python 3.10+ (for `ml/` service)
- macOS/Linux shell (commands shown for zsh/bash)
- Optional: Google Cloud SDK (`gcloud`) if running image-signed URL flows locally

## Frontend dependencies

Path: `frontend/package.json`

### Runtime
- `next@^16.1.5`
- `react@^19.2.3`
- `react-dom@^19.2.3`
- `lucide-react@^0.563.0`

### Development / testing
- `typescript@^5`
- `eslint@^9`, `eslint-config-next@16.1.5`
- `tailwindcss@^4`, `@tailwindcss/postcss@^4`
- `vitest@^4.1.4`, `jsdom@^29.0.2`, `@vitejs/plugin-react@^6.0.1`
- `@testing-library/react@^16.3.2`, `@testing-library/jest-dom@^6.9.1`, `@testing-library/user-event@^14.6.1`
- `playwright@^1.49.0`

Install frontend dependencies:

```bash
cd frontend
npm install
```

## Backend dependencies

Path: `TBPBackend/TBPBackend.Api/TBPBackend.Api.csproj`

### API + auth + docs
- `Microsoft.AspNetCore.Authentication.JwtBearer@10.0.3`
- `Microsoft.AspNetCore.Identity.EntityFrameworkCore@10.0.3`
- `Microsoft.AspNetCore.Mvc.NewtonsoftJson@10.0.3`
- `Microsoft.AspNetCore.OpenApi@10.0.0`
- `Swashbuckle.AspNetCore.SwaggerGen@10.1.2`
- `Swashbuckle.AspNetCore.SwaggerUI@10.1.2`
- `System.IdentityModel.Tokens.Jwt@8.15.0`

### Data layer
- `Microsoft.EntityFrameworkCore@10.0.3`
- `Microsoft.EntityFrameworkCore.Design@10.0.3`
- `Microsoft.EntityFrameworkCore.InMemory@10.0.3`
- `Microsoft.EntityFrameworkCore.Sqlite@10.0.3`
- `Npgsql.EntityFrameworkCore.PostgreSQL@10.0.0`
- `System.Data.SQLite.EF6@2.0.2`

### Storage integration
- `Google.Cloud.Storage.V1@4.14.0`

Install backend dependencies:

```bash
cd TBPBackend/TBPBackend.Api
dotnet restore
```

## Backend test dependencies

Path: `TBPBackend/TBPBackend.Tests/TBPBackend.Tests.csproj`

- `xunit`
- `xunit.runner.visualstudio`
- `Microsoft.NET.Test.Sdk`
- `coverlet.collector`

Current versions:
- `xunit@2.9.3`
- `xunit.runner.visualstudio@3.1.4`
- `Microsoft.NET.Test.Sdk@17.14.1`
- `coverlet.collector@6.0.4`

Run backend tests:

```bash
cd TBPBackend
dotnet test
```

## ML service dependencies

Path: `ml/app/requirements.txt`

- `fastapi`, `uvicorn[standard]`
- `pydantic_settings`
- `numpy`, `opencv-python`, `pillow`
- `httpx`
- `torch`, `torchvision`
- `detectron2` (installed separately from source)

## Environment variables / config required for successful run

### Frontend

- `NEXT_PUBLIC_API_BASE_URL`
  - Local full-stack: `http://localhost:5023`
  - Hosted API: `https://tbp-backend-134310339623.us-central1.run.app`

### Backend

Defined in `TBPBackend/TBPBackend.Api/appsettings.Development.json` or environment:
- `ConnectionStrings:DefaultConnection`
- `Jwt:Issuer`
- `Jwt:Audience`
- `Jwt:SecretKey`
- `Cors:AllowedOrigins` (optional extra explicit origins in addition to localhost + `*.vercel.app`)

Install ML dependencies:

```bash
cd ml
python3 -m venv .venv
source .venv/bin/activate
pip install -r app/requirements.txt
pip install --no-build-isolation 'git+https://github.com/facebookresearch/detectron2.git'
```

