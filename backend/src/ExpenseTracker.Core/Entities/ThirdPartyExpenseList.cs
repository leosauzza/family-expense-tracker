namespace ExpenseTracker.Core.Entities;

public class ThirdPartyExpenseList
{
    public Guid Id { get; set; }
    public Guid MonthlyDataId { get; set; }
    public MonthlyData MonthlyData { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<ThirdPartyExpense> Expenses { get; set; } = new List<ThirdPartyExpense>();
}
