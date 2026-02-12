namespace ExpenseTracker.Api.DTOs;

public class UserDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Initial { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}

public class UserResponse
{
    public bool Success { get; set; }
    public List<UserDto>? Data { get; set; }
    public string? Error { get; set; }
}

public class SingleUserResponse
{
    public bool Success { get; set; }
    public UserDto? Data { get; set; }
    public string? Error { get; set; }
}
