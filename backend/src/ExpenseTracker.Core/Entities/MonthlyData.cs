namespace ExpenseTracker.Core.Entities;

public class MonthlyData
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal WalletAmount { get; set; }
    public bool DataCopiedFromPreviousMonth { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<FixedExpense> FixedExpenses { get; set; } = new List<FixedExpense>();
    public ICollection<SharedExpense> SharedExpensesPaidByUser { get; set; } = new List<SharedExpense>();
    public ICollection<ThirdPartyExpenseList> ThirdPartyExpenseLists { get; set; } = new List<ThirdPartyExpenseList>();
}
