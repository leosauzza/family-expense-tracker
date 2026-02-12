namespace ExpenseTracker.Core.Entities;

public class CreditCardExtractedExpense
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid MonthlyDataId { get; set; }
    public MonthlyData MonthlyData { get; set; } = null!;
    public string Detail { get; set; } = string.Empty;
    public decimal AmountARS { get; set; }
    public decimal AmountUSD { get; set; }
    public DateTime ExtractedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
}
