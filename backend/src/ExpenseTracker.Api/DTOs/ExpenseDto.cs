namespace ExpenseTracker.Api.DTOs;

public class ExpenseDto
{
    public Guid Id { get; set; }
    public string Detail { get; set; } = string.Empty;
    public decimal AmountARS { get; set; }
    public decimal AmountUSD { get; set; }
    public bool IsPaid { get; set; }
}

public class FixedExpenseDto : ExpenseDto
{
    public Guid MonthlyDataId { get; set; }
}

public class SharedExpenseDto : ExpenseDto
{
    public Guid MonthlyDataId { get; set; }
    public Guid PaidByUserId { get; set; }
    public string PaidByUserName { get; set; } = string.Empty;
    public string ExpenseType { get; set; } = "SplitWithAllSystemUsers";
    public List<string> ExternalParties { get; set; } = new();
    public Guid? TargetUserId { get; set; }
    public string? TargetUserName { get; set; }
}

public class ThirdPartyExpenseDto : ExpenseDto
{
    public Guid ThirdPartyExpenseListId { get; set; }
}

public class ThirdPartyExpenseListDto
{
    public Guid Id { get; set; }
    public Guid MonthlyDataId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; }
    public List<ThirdPartyExpenseDto> Expenses { get; set; } = new();
}

public class CreateExpenseRequest
{
    public Guid MonthlyDataId { get; set; }
    public string Detail { get; set; } = string.Empty;
    public decimal AmountARS { get; set; }
    public decimal AmountUSD { get; set; }
    public bool IsPaid { get; set; }
    public string ExpenseType { get; set; } = "SplitWithAllSystemUsers";
    public List<string> ExternalParties { get; set; } = new();
    public Guid? TargetUserId { get; set; }
}

public class CreateThirdPartyExpenseRequest
{
    public Guid ListId { get; set; }
    public string Detail { get; set; } = string.Empty;
    public decimal AmountARS { get; set; }
    public decimal AmountUSD { get; set; }
    public bool IsPaid { get; set; }
}

public class UpdateExpenseRequest
{
    public string Detail { get; set; } = string.Empty;
    public decimal AmountARS { get; set; }
    public decimal AmountUSD { get; set; }
    public bool IsPaid { get; set; }
    public string? ExpenseType { get; set; }
    public List<string>? ExternalParties { get; set; }
    public Guid? TargetUserId { get; set; }
}

public class TogglePaidRequest
{
    public bool IsPaid { get; set; }
}

public class CreateThirdPartyListRequest
{
    public Guid MonthlyDataId { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class UpdateListNameRequest
{
    public string Name { get; set; } = string.Empty;
}

public class ExtractedExpenseDto
{
    public Guid Id { get; set; }
    public string Detail { get; set; } = string.Empty;
    public decimal AmountARS { get; set; }
    public decimal AmountUSD { get; set; }
}

public class ExpenseClassification
{
    public Guid ExtractedExpenseId { get; set; }
    public string ClassificationType { get; set; } = "Personal";  // Personal, Shared, OtherPerson
    public bool IsSharedWithExternal { get; set; }
    public string? SharedWithOption { get; set; }  // "system_family" or "other"
    public List<string> ExternalPartyNames { get; set; } = new();
    public Guid? OtherPersonUserId { get; set; }
    public string? OtherPersonName { get; set; }
}

public class ConfirmExtractedExpensesRequest
{
    public Guid MonthlyDataId { get; set; }
    public List<ExpenseClassification> Classifications { get; set; } = new();
}

public class UpdateListOrderRequest
{
    public Guid ListId { get; set; }
    public int NewOrder { get; set; }
}

public class ReorderListsRequest
{
    public List<ListOrderItem> Items { get; set; } = new();
}

public class ListOrderItem
{
    public Guid Id { get; set; }
    public int Order { get; set; }
}
