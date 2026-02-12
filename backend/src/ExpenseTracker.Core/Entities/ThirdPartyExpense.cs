namespace ExpenseTracker.Core.Entities;

public class ThirdPartyExpense
{
    public Guid Id { get; set; }
    public Guid ThirdPartyExpenseListId { get; set; }
    public ThirdPartyExpenseList ThirdPartyExpenseList { get; set; } = null!;
    public string Detail { get; set; } = string.Empty;
    public decimal AmountARS { get; set; }
    public decimal AmountUSD { get; set; }
    public bool IsPaid { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
