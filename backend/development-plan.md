# Backend - Development Plan

## Phase 1: Project Setup & Core Structure

### 1.1 Create Solution Structure
```bash
dotnet new sln -n ExpenseTracker
dotnet new webapi -n ExpenseTracker.Api -o src/ExpenseTracker.Api
dotnet new classlib -n ExpenseTracker.Core -o src/ExpenseTracker.Core
dotnet new classlib -n ExpenseTracker.Infrastructure -o src/ExpenseTracker.Infrastructure
dotnet sln add src/ExpenseTracker.Api/ExpenseTracker.Api.csproj
dotnet sln add src/ExpenseTracker.Core/ExpenseTracker.Core.csproj
dotnet sln add src/ExpenseTracker.Infrastructure/ExpenseTracker.Infrastructure.csproj
```

### 1.2 Configure Project References
- `ExpenseTracker.Api` → `ExpenseTracker.Core`, `ExpenseTracker.Infrastructure`
- `ExpenseTracker.Infrastructure` → `ExpenseTracker.Core`

### 1.3 Add NuGet Packages
**Infrastructure:**
- Microsoft.EntityFrameworkCore
- Npgsql.EntityFrameworkCore.PostgreSQL

**API:**
- Swashbuckle.AspNetCore

## Phase 2: Domain Layer (Core)

### 2.1 Create Entities
- [ ] User.cs
- [ ] MonthlyData.cs
- [ ] FixedExpense.cs
- [ ] SharedExpense.cs
- [ ] ThirdPartyExpenseList.cs
- [ ] ThirdPartyExpense.cs
- [ ] ActivityLog.cs

### 2.2 Create Enums
- [ ] ActivityType.cs

### 2.3 Create Repository Interfaces
- [ ] IUserRepository
- [ ] IMonthlyDataRepository
- [ ] IFixedExpenseRepository
- [ ] ISharedExpenseRepository
- [ ] IThirdPartyExpenseRepository
- [ ] IActivityLogRepository

## Phase 3: Infrastructure Layer

### 3.1 Database Context
- [ ] Create ApplicationDbContext
- [ ] Configure entity relationships
- [ ] Configure indexes

### 3.2 Repository Implementations
- [ ] UserRepository
- [ ] MonthlyDataRepository (with Include for related data)
- [ ] FixedExpenseRepository
- [ ] SharedExpenseRepository
- [ ] ThirdPartyExpenseRepository
- [ ] ActivityLogRepository

### 3.3 Migrations
- [ ] Initial migration
- [ ] Apply migrations on startup

## Phase 4: API Layer

### 4.1 DTOs
Create request/response DTOs for:
- [ ] Users
- [ ] MonthlyData
- [ ] FixedExpenses
- [ ] SharedExpenses
- [ ] ThirdPartyExpenses
- [ ] ActivityLog

### 4.2 Controllers
- [ ] UsersController (GET /api/users)
- [ ] MonthlyDataController
  - GET /api/monthly-data
  - POST /api/monthly-data
  - PUT /api/monthly-data/{id}/wallet
  - POST /api/monthly-data/{id}/copy-from-previous
- [ ] FixedExpensesController
  - POST, PUT, DELETE, PUT /paid
- [ ] SharedExpensesController
  - POST, PUT, DELETE, PUT /paid
  - GET /paid-by-others
- [ ] ThirdPartyExpensesController
  - List CRUD
  - Expense CRUD within lists
- [ ] ActivityLogController
  - GET /api/activity-log

### 4.3 Services
- [ ] CalculationService (for the final balance formula)
- [ ] CopyFromPreviousMonthService
- [ ] ActivityLoggingService

### 4.4 Configuration
- [ ] Program.cs setup
- [ ] Dependency injection
- [ ] CORS for frontend
- [ ] Swagger configuration

## Phase 5: Docker & Integration

### 5.1 Dockerfile
- Multi-stage build
- Development stage with hot reload

### 5.2 Seed Data
- [ ] Seed 2 initial users (Leo, Anto)

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | List all users |
| GET | /api/monthly-data | Get by user/year/month |
| POST | /api/monthly-data | Create new |
| PUT | /api/monthly-data/{id}/wallet | Update wallet |
| POST | /api/monthly-data/{id}/copy | Copy from previous |
| POST | /api/fixed-expenses | Create fixed expense |
| PUT | /api/fixed-expenses/{id} | Update |
| DELETE | /api/fixed-expenses/{id} | Delete |
| PUT | /api/fixed-expenses/{id}/paid | Toggle paid |
| POST | /api/shared-expenses | Create shared expense |
| PUT | /api/shared-expenses/{id} | Update |
| DELETE | /api/shared-expenses/{id} | Delete |
| PUT | /api/shared-expenses/{id}/paid | Toggle paid |
| GET | /api/shared-expenses/paid-by-others | Get shared by others |
| POST | /api/third-party-lists | Create list |
| PUT | /api/third-party-lists/{id}/name | Rename list |
| DELETE | /api/third-party-lists/{id} | Delete list |
| POST | /api/third-party-lists/{id}/expenses | Add expense |
| PUT | /api/third-party-lists/expenses/{id} | Update expense |
| DELETE | /api/third-party-lists/expenses/{id} | Delete expense |
| PUT | /api/third-party-lists/expenses/{id}/paid | Toggle paid |
| GET | /api/activity-log | Get recent activity |

## Testing Checklist

- [ ] All endpoints return proper JSON
- [ ] CORS allows frontend origin
- [ ] Database migrations run successfully
- [ ] Seed data creates initial users
- [ ] Copy from previous month works correctly
- [ ] Calculations exclude paid expenses
- [ ] All actions are logged (except copy)
