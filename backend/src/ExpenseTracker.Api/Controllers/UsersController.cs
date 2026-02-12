using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ExpenseTracker.Infrastructure.Data;
using ExpenseTracker.Api.DTOs;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public UsersController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<UserResponse>> GetAll()
    {
        var users = await _context.Users
            .Select(u => new UserDto
            {
                Id = u.Id,
                Name = u.Name,
                Slug = u.Slug,
                Initial = u.Initial,
                Color = u.Color
            })
            .ToListAsync();

        return Ok(new UserResponse { Success = true, Data = users });
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<SingleUserResponse>> GetBySlug(string slug)
    {
        var user = await _context.Users
            .Where(u => u.Slug == slug.ToLower())
            .Select(u => new UserDto
            {
                Id = u.Id,
                Name = u.Name,
                Slug = u.Slug,
                Initial = u.Initial,
                Color = u.Color
            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return NotFound(new SingleUserResponse { Success = false, Error = "User not found" });
        }

        return Ok(new SingleUserResponse { Success = true, Data = user });
    }
}
