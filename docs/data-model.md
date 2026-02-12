# Family Expense Tracker - Data Model

## Entities

### User
```csharp
public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Initial { get; set; } = string.Empty; // For profile picture
    public string Color { get; set; } = string.Empty;   // For UI theming
    public DateTime CreatedAt { get; set; }
}
```

### MonthlyData
Main container for all data related to a user in a specific month/year.
```csharp
public class MonthlyData
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal WalletAmount { get; set; }
    public bool DataCopiedFromPreviousMonth { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Navigation properties
    public ICollection<FixedExpense> FixedExpenses { get; set; } = new List<FixedExpense>();
    public ICollection<SharedExpense> SharedExpensesPaidByUser { get; set; } = new List<SharedExpense>();
    public ICollection<ThirdPartyExpenseList> ThirdPartyExpenseLists { get; set; } = new List<ThirdPartyExpenseList>();
}
```

### FixedExpense
Monthly fixed expenses (credit cards, rent, school, etc.)
```csharp
public class FixedExpense
{
    public Guid Id { get; set; }
    public Guid MonthlyDataId { get; set; }
    public MonthlyData MonthlyData { get; set; } = null!;
    public string Detail { get; set; } = string.Empty;
    public decimal AmountARS { get; set; }
    public decimal AmountUSD { get; set; }
    public bool IsPaid { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

### SharedExpense
Shared expenses between system users
```csharp
public class SharedExpense
{
    public Guid Id { get; set; }
    public Guid MonthlyDataId { get; set; }
    public MonthlyData MonthlyData { get; set; } = null!;
    public Guid PaidByUserId { get; set; }  // The user who paid
    public User PaidByUser { get; set; } = null!;
    public string Detail { get; set; } = string.Empty;
    public decimal AmountARS { get; set; }
    public decimal AmountUSD { get; set; }
    public bool IsPaid { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

### ThirdPartyExpenseList
Dynamic lists for expenses paid for non-system people
```csharp
public class ThirdPartyExpenseList
{
    public Guid Id { get; set; }
    public Guid MonthlyDataId { get; set; }
    public MonthlyData MonthlyData { get; set; } = null!;
    public string Name { get; set; } = string.Empty; // Editable title
    public int Order { get; set; } // For ordering lists
    public DateTime CreatedAt { get; set; }
    
    public ICollection<ThirdPartyExpense> Expenses { get; set; } = new List<ThirdPartyExpense>();
}
```

### ThirdPartyExpense
Individual expenses in a third-party list
```csharp
public class ThirdPartyExpense
{
    public Guid Id { get; set; }
    public Guid ThirdPartyExpenseListId { get; set; }
    public ThirdPartyExpenseList ThirdPartyExpenseList { get; set; } = null!;
    public string Detail { get; set; } = string.Empty;
    public decimal AmountARS { get; set; }
    public decimal AmountUSD { get; set; }
    public bool IsPaid { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

### ActivityLog
Audit log for all actions
```csharp
public class ActivityLog
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public ActivityType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? EntityType { get; set; } // "FixedExpense", "SharedExpense", etc.
    public string? EntityId { get; set; }
    public string? OldValue { get; set; } // JSON for complex changes
    public string? NewValue { get; set; }
    public int? Year { get; set; } // Context month/year
    public int? Month { get; set; }
    public DateTime CreatedAt { get; set; }
}

public enum ActivityType
{
    WalletUpdated,
    FixedExpenseCreated,
    FixedExpenseUpdated,
    FixedExpenseDeleted,
    SharedExpenseCreated,
    SharedExpenseUpdated,
    SharedExpenseDeleted,
    ThirdPartyExpenseListCreated,
    ThirdPartyExpenseListUpdated,
    ThirdPartyExpenseListDeleted,
    ThirdPartyExpenseCreated,
    ThirdPartyExpenseUpdated,
    ThirdPartyExpenseDeleted,
    ExpenseMarkedAsPaid,
    MonthlyDataCopied
}
```

## Relationships Summary

```
User 1--* MonthlyData
MonthlyData 1--* FixedExpense
MonthlyData 1--* SharedExpense
MonthlyData 1--* ThirdPartyExpenseList
ThirdPartyExpenseList 1--* ThirdPartyExpense
User 1--* ActivityLog
```

## API Endpoints Overview

### Users
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by id

### Monthly Data
- `GET /api/monthly-data?userId={id}&year={year}&month={month}` - Get monthly data
- `POST /api/monthly-data` - Create monthly data
- `PUT /api/monthly-data/{id}/wallet` - Update wallet amount
- `POST /api/monthly-data/{id}/copy-from-previous` - Copy from previous month

### Fixed Expenses
- `POST /api/fixed-expenses` - Create
- `PUT /api/fixed-expenses/{id}` - Update
- `DELETE /api/fixed-expenses/{id}` - Delete
- `PUT /api/fixed-expenses/{id}/paid` - Toggle paid status

### Shared Expenses
- `POST /api/shared-expenses` - Create
- `PUT /api/shared-expenses/{id}` - Update
- `DELETE /api/shared-expenses/{id}` - Delete
- `PUT /api/shared-expenses/{id}/paid` - Toggle paid status
- `GET /api/shared-expenses/paid-by-others?userId={id}&year={year}&month={month}`

### Third Party Expense Lists
- `POST /api/third-party-lists` - Create list
- `PUT /api/third-party-lists/{id}/name` - Update name
- `DELETE /api/third-party-lists/{id}` - Delete list
- `POST /api/third-party-lists/{id}/expenses` - Add expense
- `PUT /api/third-party-lists/expenses/{id}` - Update expense
- `DELETE /api/third-party-lists/expenses/{id}` - Delete expense
- `PUT /api/third-party-lists/expenses/{id}/paid` - Toggle paid status

### Activity Log
- `GET /api/activity-log?userId={id}&limit={n}` - Get recent activity

## Calculation Formula

```
FinalBalance = WalletAmount 
             + Sum(ThirdPartyExpenses.Amount)
             - Sum(FixedExpenses.Where(e => !e.IsPaid).Amount)
             + ((Sum(SharedExpensesPaidByOther.Where(e => !e.IsPaid).Amount) 
                + Sum(SharedExpensesPaidByUser.Where(e => !e.IsPaid).Amount)) 
                / TotalSystemUsers)
```

Note: Only unpaid expenses are included in the calculation.
