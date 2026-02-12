# Family Expense Tracker

A web-based SPA application for tracking personal and shared expenses between family members.

## Features

- User selection with localStorage persistence
- Monthly dashboard with expense tracking
- Fixed monthly expenses (credit cards, rent, school, etc.)
- Shared expenses between users
- Third-party expense lists with editable names
- Wallet amount tracking
- Multi-language support (Spanish/English)
- Responsive design for all devices

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- React Router v6
- CSS Modules

### Backend
- .NET 8 Web API
- Entity Framework Core
- PostgreSQL

## Quick Start

### Prerequisites
- Docker
- Docker Compose

### Run the Application

```bash
# Start all services
docker compose up -d

# Access the application
open http://localhost:3000
```

### Development

```bash
# View logs
docker compose logs -f

# Stop services
docker compose down

# Reset database
docker compose down -v
docker compose up -d
```

## Default Users

- **Leo** (slug: leo)
- **Anto** (slug: Anto)

## URL Structure

- Home: `/`
- Dashboard: `/:userSlug/dashboard`
- Specific month: `/:userSlug/:year-:month` (e.g., `/leo/2026-02`)

## Project Structure

```
family-expense-tracker/
├── AGENTS.md              # Global specifications
├── README.md              # This file
├── docker-compose.yml     # Docker orchestration
├── .env                   # Environment variables
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

## Development Phases

1. ✅ Project scaffolding and documentation
2. ✅ Frontend with hardcoded fake data
3. 🔄 Backend API implementation (next)
4. ⏳ Database integration
5. ⏳ Credit card PDF import (iteration 2)

## License

Private - For family use only.
