namespace ExpenseTracker.Api.DTOs;

public class MonthlyDataDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal WalletAmount { get; set; }
    public bool DataCopiedFromPreviousMonth { get; set; }
    public List<FixedExpenseDto> FixedExpenses { get; set; } = new();
    public List<SharedExpenseDto> SharedExpensesPaidByUser { get; set; } = new();
    public List<ThirdPartyExpenseListDto> ThirdPartyExpenseLists { get; set; } = new();
}

public class MonthlyDataResponse
{
    public bool Success { get; set; }
    public MonthlyDataDto? Data { get; set; }
    public string? Error { get; set; }
}

public class CreateMonthlyDataRequest
{
    public Guid UserId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
}

public class UpdateWalletRequest
{
    public decimal Amount { get; set; }
}
