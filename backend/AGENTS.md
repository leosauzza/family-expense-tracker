# Backend - AGENTS.md

## Service Overview

.NET 8 Web API providing REST endpoints for the expense tracker application.

## Tech Stack

- **Framework**: .NET 8
- **Project Type**: ASP.NET Core Web API
- **ORM**: Entity Framework Core 8
- **Database Provider**: Npgsql (PostgreSQL)
- **API Documentation**: Swagger/OpenAPI

## Project Structure

```
backend/
├── AGENTS.md
├── development-plan.md
├── src/
│   ├── ExpenseTracker.Api/
│   │   ├── Controllers/           # API Controllers
│   │   │   ├── UsersController.cs
│   │   │   ├── MonthlyDataController.cs
│   │   │   ├── FixedExpensesController.cs
│   │   │   ├── SharedExpensesController.cs
│   │   │   └── ThirdPartyExpensesController.cs
│   │   ├── DTOs/                  # Data Transfer Objects
│   │   ├── Program.cs
│   │   └── appsettings.json
│   ├── ExpenseTracker.Core/
│   │   ├── Entities/              # Domain entities
│   │   │   ├── User.cs
│   │   │   ├── MonthlyData.cs
│   │   │   ├── FixedExpense.cs
│   │   │   ├── SharedExpense.cs
│   │   │   ├── ThirdPartyExpenseList.cs
│   │   │   ├── ThirdPartyExpense.cs
│   │   │   └── ActivityLog.cs
│   │   └── Enums/                 # Enums
│   │       └── ActivityType.cs
│   └── ExpenseTracker.Infrastructure/
│       ├── Data/                  # DbContext
│       │   └── ApplicationDbContext.cs
│       └── Migrations/            # EF Migrations
├── Dockerfile
└── .dockerignore
```

## Architecture Pattern

Clean Architecture / Layered Architecture:
- **Core**: Domain entities, enums (no external dependencies)
- **Infrastructure**: Data access, EF Core (depends on Core)
- **API**: Controllers, DI configuration (depends on Core and Infrastructure)

## API Endpoints

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/{slug}` | Get user by slug (leo, anto) |

### Monthly Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/monthlydata?userId={id}&year={year}&month={month}` | Get monthly data (auto-creates if not exists) |
| POST | `/api/monthlydata` | Create monthly data |
| PUT | `/api/monthlydata/{id}/wallet` | Update wallet amount |
| POST | `/api/monthlydata/{id}/copy-from-previous` | Copy from previous month (gracefully handles missing previous) |

### Fixed Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/fixedexpenses` | Create fixed expense |
| PUT | `/api/fixedexpenses/{id}` | Update fixed expense |
| DELETE | `/api/fixedexpenses/{id}` | Delete fixed expense |
| PUT | `/api/fixedexpenses/{id}/toggle-paid` | Toggle paid status |

### Shared Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sharedexpenses` | Create shared expense |
| PUT | `/api/sharedexpenses/{id}` | Update shared expense |
| DELETE | `/api/sharedexpenses/{id}` | Delete shared expense |
| PUT | `/api/sharedexpenses/{id}/toggle-paid` | Toggle paid status |
| GET | `/api/sharedexpenses/paid-by-others?userId={id}&year={year}&month={month}` | Get expenses paid by other users |

### Third Party Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/thirdpartyexpenses/lists` | Create expense list |
| PUT | `/api/thirdpartyexpenses/lists/{id}/name` | Update list name |
| DELETE | `/api/thirdpartyexpenses/lists/{id}` | Delete list |
| POST | `/api/thirdpartyexpenses/lists/{listId}/expenses` | Add expense to list |
| PUT | `/api/thirdpartyexpenses/expenses/{id}` | Update expense |
| DELETE | `/api/thirdpartyexpenses/expenses/{id}` | Delete expense |
| PUT | `/api/thirdpartyexpenses/expenses/{id}/toggle-paid` | Toggle paid status |

## API Response Format

```json
{
  "success": true,
  "data": { },
  "error": null
}
```

## Key Business Logic

### Auto-Create Monthly Data
The GET `/api/monthlydata` endpoint automatically creates empty monthly data if it doesn't exist, preventing 404 errors.

### Copy from Previous Month
1. Find previous month's `MonthlyData` for the user
2. Clone all related entities (FixedExpenses, SharedExpenses, ThirdPartyExpenseLists)
3. Set WalletAmount to 0
4. Set DataCopiedFromPreviousMonth = true
5. Reset all IsPaid to false
6. **Graceful handling**: If previous month doesn't exist, marks current as copied with empty data

### Calculation Service (Frontend)
- Only include unpaid expenses in calculations
- Formula: Wallet + ThirdPartySum - FixedExpensesSum + ((SharedByOther + SharedByUser) / TotalUsers)

## Database Connection

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=db;Port=5432;Database=expensetracker;Username=postgres;Password=postgres"
  }
}
```

## Seeded Data

Two users are automatically seeded on first run:

```csharp
new User { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), Name = "Leo", Slug = "leo", Initial = "L", Color = "#6366f1" }
new User { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Name = "Anto", Slug = "anto", Initial = "A", Color = "#ec4899" }
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ASPNETCORE_ENVIRONMENT` | Environment | Development |
| `ConnectionStrings__DefaultConnection` | DB connection | (see above) |

## Docker

The backend runs in a container exposing port 8080.
Uses `dotnet watch` in development for hot reload.

## Migrations

```bash
# Create migration
dotnet ef migrations add MigrationName --project src/ExpenseTracker.Infrastructure --startup-project src/ExpenseTracker.Api

# Apply migrations
dotnet ef database update --project src/ExpenseTracker.Infrastructure --startup-project src/ExpenseTracker.Api
```

Migrations are automatically applied on container startup.
