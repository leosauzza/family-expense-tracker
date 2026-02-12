using ExpenseTracker.Core.Enums;

namespace ExpenseTracker.Api.DTOs;

public class ActivityLogDto
{
    public Guid Id { get; set; }
    public ActivityType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ActivityLogResponse
{
    public bool Success { get; set; }
    public List<ActivityLogDto>? Data { get; set; }
    public string? Error { get; set; }
}
