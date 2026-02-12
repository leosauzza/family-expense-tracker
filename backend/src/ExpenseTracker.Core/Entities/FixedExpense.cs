namespace ExpenseTracker.Core.Entities;

public class FixedExpense
{
    public Guid Id { get; set; }
    public Guid MonthlyDataId { get; set; }
    public MonthlyData MonthlyData { get; set; } = null!;
    public string Detail { get; set; } = string.Empty;
    public decimal AmountARS { get; set; }
    public decimal AmountUSD { get; set; }
    public bool IsPaid { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
