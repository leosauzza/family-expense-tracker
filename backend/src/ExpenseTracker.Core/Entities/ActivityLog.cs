using ExpenseTracker.Core.Enums;

namespace ExpenseTracker.Core.Entities;

public class ActivityLog
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public ActivityType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public int? Year { get; set; }
    public int? Month { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
