# Database - AGENTS.md

## Overview

PostgreSQL 16 database for the expense tracker application.

## Configuration

### Connection Details
- **Host**: `db` (Docker service name)
- **Port**: `5432`
- **Database**: `expensetracker`
- **Username**: `postgres`
- **Password**: `postgres` (development only)

### Docker Service
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: expensetracker
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
```

## Schema

Managed by Entity Framework Core migrations in the backend project.

### Tables

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `Users` | System users | Id, Name, Slug, Initial, Color |
| `MonthlyData` | Monthly snapshot per user | Id, UserId, Year, Month, WalletAmount |
| `FixedExpenses` | Fixed monthly expenses | Id, MonthlyDataId, Detail, AmountARS, AmountUSD, IsPaid |
| `SharedExpenses` | Shared expenses between users | Id, MonthlyDataId, PaidByUserId, Detail, AmountARS, AmountUSD, IsPaid |
| `ThirdPartyExpenseLists` | Dynamic lists for third-party expenses | Id, MonthlyDataId, Name, Order |
| `ThirdPartyExpenses` | Expenses in third-party lists | Id, ThirdPartyExpenseListId, Detail, AmountARS, AmountUSD, IsPaid |
| `ActivityLogs` | Audit trail (prepared) | Id, UserId, Type, Description, EntityType |

### Key Indexes

- `IX_MonthlyData_UserId_Year_Month` - Unique constraint
- `IX_FixedExpenses_MonthlyDataId`
- `IX_SharedExpenses_MonthlyDataId`
- `IX_ThirdPartyExpenseLists_MonthlyDataId`
- `IX_ActivityLogs_UserId_CreatedAt`

### Seeded Data

On first migration, two users are automatically created:

```sql
-- Leo
INSERT INTO "Users" ("Id", "Name", "Slug", "Initial", "Color", "CreatedAt")
VALUES ('11111111-1111-1111-1111-111111111111', 'Leo', 'leo', 'L', '#6366f1', NOW());

-- Anto
INSERT INTO "Users" ("Id", "Name", "Slug", "Initial", "Color", "CreatedAt")
VALUES ('22222222-2222-2222-2222-222222222222', 'Anto', 'anto', 'A', '#ec4899', NOW());
```

## Data Persistence

Database data is persisted in a Docker volume:
```yaml
volumes:
  postgres_data:
```

To persist data between restarts:
```bash
# Stop containers but keep volume
docker compose down

# Restart with existing data
docker compose up -d
```

To reset the database:
```bash
# Remove volume and recreate
docker compose down -v
docker compose up -d
```

## Backup & Restore

### Backup
```bash
docker exec expense-tracker-db pg_dump -U postgres expensetracker > backup.sql
```

### Restore
```bash
docker exec -i expense-tracker-db psql -U postgres expensetracker < backup.sql
```

## Entity Relationships

```
User 1--* MonthlyData
MonthlyData 1--* FixedExpense
MonthlyData 1--* SharedExpense
MonthlyData 1--* ThirdPartyExpenseList
ThirdPartyExpenseList 1--* ThirdPartyExpense
User 1--* ActivityLog
```

## Migration History

Migrations are stored in:
```
backend/src/ExpenseTracker.Infrastructure/Migrations/
```

Applied automatically on container startup via:
```csharp
// Program.cs
db.Database.Migrate();
```

## Decimal Precision

All monetary amounts use `decimal(18,2)` precision:
- `AmountARS`: Argentine Peso amounts
- `AmountUSD`: US Dollar amounts
- `WalletAmount`: User's wallet balance
