namespace ExpenseTracker.Core.Enums;

public enum SharedExpenseType
{
    SplitWithAllSystemUsers,     // Default - split among all system users
    SplitWithExternalParties,    // Share with external people + system users
    ForSpecificSystemUser        // Paid by me, belongs to specific user (not shared)
}
