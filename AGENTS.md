# Family Expense Tracker - Global AGENTS.md

## Project Overview

Family expense tracker is a web-based SPA application for tracking personal and shared expenses between family members. It's designed to run locally with Docker Compose.

## Architecture

```
┌─────────────────┐
│   Frontend      │  React 18 + TypeScript + Vite
│   (Port 3000)   │  SPA, minimalist UI, responsive
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│    Backend      │  .NET 8 Web API
│   (Port 8080)   │  REST API, EF Core, PostgreSQL
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌─────────────────┐
│   DB   │  │  PDF Parser     │  Node.js + pdf.js
│PostgreSQL│  │  (Port 3001)    │  Position-based parsing
│  :5432 │  └─────────────────┘
└────────┘
```

## Tech Stack

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Router**: React Router v6
- **Styling**: CSS Modules + CSS Variables
- **State**: React Context API + useReducer
- **Icons**: Lucide React
- **HTTP**: Native Fetch API with dynamic hostname detection

### Backend
- **Framework**: .NET 8 Web API
- **ORM**: Entity Framework Core 8
- **Database**: PostgreSQL 16
- **Documentation**: Swagger/OpenAPI

### PDF Parser Service
- **Runtime**: Node.js 20
- **PDF Engine**: Mozilla pdf.js with position-based extraction
- **API**: Express.js
- **Parsing Strategy**: X/Y coordinate-based column detection

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database Persistence**: Docker volume `postgres_data`

## Directory Structure

```
family-expense-tracker/
├── AGENTS.md              # This file - Global specs
├── README.md              # User documentation
├── restart.sh             # Restart script with rebuild
├── .env                   # Environment variables
├── docker-compose.yml     # Docker orchestration
├── docs/
│   └── data-model.md      # Database schema
├── backend/               # .NET Web API
│   ├── AGENTS.md
│   ├── development-plan.md
│   └── src/
├── frontend/              # React SPA
│   ├── AGENTS.md
│   ├── development-plan.md
│   └── src/
└── database/              # Database documentation
    └── AGENTS.md
```

## Quick Commands

```bash
# Start all services
./restart.sh

# Or manually:
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services (preserve data)
docker compose down

# Reset database
docker compose down -v
docker compose up -d --build
```

## Global Conventions

### Code Style
- Use English for all code (variables, functions, comments)
- Follow existing patterns in each service
- Prefer explicit over implicit
- Keep functions small and focused

### Git
- Do not run git commands unless explicitly asked
- Each service is in its own directory

### Docker
- Services communicate via Docker network
- Use service names for inter-service communication
- Volume persistence for database

### Internationalization (i18n)
- Spanish is the default language
- All static text must support multi-language
- Translation files in `/public/locales/`

## URL Structure

- Home: `/`
- User Dashboard: `/:userSlug/dashboard`
- Specific Month: `/:userSlug/:year-:month`

Examples:
- `/leo/dashboard` - Leo's current month dashboard
- `/anto/2026-02` - Anto's February 2026 expenses

## Default Users (Seeded)

| Name | Slug | Initial | Color |
|------|------|---------|-------|
| Leo  | leo  | L       | #6366f1 |
| Anto | anto | A       | #ec4899 |

## Access URLs

| Service | URL |
|---------|-----|
| Frontend (local) | http://localhost:3000 |
| Frontend (network) | http://YOUR_IP:3000 |
| Backend API | http://localhost:8080/api |
| Swagger | http://localhost:8080/swagger |

## Color Palette (UI)

```css
:root {
  --color-primary: #6366f1;
  --color-primary-light: #818cf8;
  --color-primary-dark: #4f46e5;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-background: #f8fafc;
  --color-surface: #ffffff;
  --color-text: #1e293b;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;
  --color-ars: #3b82f6;      /* Blue for ARS */
  --color-usd: #10b981;      /* Green for USD */
}
```

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile Portrait | < 480px | 1 column, stacked rows |
| Mobile Landscape | 480-767px | Compact 5-column grid |
| Tablet Portrait | 768-1023px | 2-column tables |
| Tablet Landscape | 1024-1279px | 2-3 column tables |
| Desktop | >= 1280px | 3 column tables |

## Feature Flags

- `CREDIT_CARD_PDF_IMPORT`: Enable credit card PDF import (Iteration 2 - implemented)

## PDF Credit Card Import Architecture

### Flow
1. User uploads PDF in frontend
2. Backend forwards PDF to PDF Parser Service (Node.js)
3. Parser extracts text with X/Y positions using pdf.js
4. Bank-specific parser (BBVA, Galicia) identifies columns by position
5. Transactions returned as JSON to backend
6. Backend returns to frontend for user review
7. User classifies each transaction (personal/shared/other person)
8. Backend creates appropriate expense records

### Why a Separate PDF Service?
- **pdf.js** has superior text position extraction vs .NET libraries
- **Column detection**: Uses X-coordinates to identify table columns
- **Multi-bank support**: Easy to add new bank parsers
- **Isolation**: PDF processing is CPU-intensive, isolated from main API

### Supported Banks
| Bank | Parser | Status |
|------|--------|--------|
| BBVA | Position-based column detection | ✅ Implemented |
| Galicia | Position-based column detection | ✅ Implemented |

### BBVA Parser Logic
BBVA statements have a table with columns: `Fecha | Descripción | Nro. Cupón | Pesos | Dólares`

The parser:
1. Detects column boundaries from header row positions
2. Classifies each text element by its X-coordinate
3. For USD transactions: extracts amount from "Dólares" column
4. For ARS transactions: extracts amount from "Pesos" column
5. Extracts installment info (C.XX/YY) from description

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Frontend API base URL | `/api` |
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection | `Host=db;Port=5432;...` |
| `ASPNETCORE_ENVIRONMENT` | .NET environment | `Development` |
