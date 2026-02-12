using ExpenseTracker.Core.Enums;

namespace ExpenseTracker.Core.Entities;

public class SharedExpense
{
    public Guid Id { get; set; }
    public Guid MonthlyDataId { get; set; }
    public MonthlyData MonthlyData { get; set; } = null!;
    public Guid PaidByUserId { get; set; }
    public User PaidByUser { get; set; } = null!;
    public string Detail { get; set; } = string.Empty;
    public decimal AmountARS { get; set; }
    public decimal AmountUSD { get; set; }
    public bool IsPaid { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // New properties for flexible sharing
    public SharedExpenseType ExpenseType { get; set; } = SharedExpenseType.SplitWithAllSystemUsers;
    public string? ExternalPartiesJson { get; set; }
    public Guid? TargetUserId { get; set; }
    public User? TargetUser { get; set; }
}
