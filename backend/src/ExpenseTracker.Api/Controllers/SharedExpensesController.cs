using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using ExpenseTracker.Infrastructure.Data;
using ExpenseTracker.Api.DTOs;
using ExpenseTracker.Core.Entities;
using ExpenseTracker.Core.Enums;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SharedExpensesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public SharedExpensesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<SharedExpenseDto>> Create([FromBody] CreateExpenseRequest request)
    {
        var monthlyData = await _context.MonthlyData.FindAsync(request.MonthlyDataId);
        if (monthlyData == null)
        {
            return NotFound("Monthly data not found");
        }

        // Parse ExpenseType from request (default to SplitWithAllSystemUsers)
        if (!Enum.TryParse<SharedExpenseType>(request.ExpenseType, out var expenseType))
        {
            expenseType = SharedExpenseType.SplitWithAllSystemUsers;
        }

        var expense = new SharedExpense
        {
            MonthlyDataId = request.MonthlyDataId,
            PaidByUserId = monthlyData.UserId,
            Detail = request.Detail,
            AmountARS = request.AmountARS,
            AmountUSD = request.AmountUSD,
            IsPaid = request.IsPaid,
            ExpenseType = expenseType,
            ExternalPartiesJson = request.ExternalParties?.Count > 0 
                ? JsonSerializer.Serialize(request.ExternalParties) 
                : null,
            TargetUserId = request.TargetUserId
        };

        _context.SharedExpenses.Add(expense);
        await _context.SaveChangesAsync();

        var user = await _context.Users.FindAsync(expense.PaidByUserId);

        return Ok(new SharedExpenseDto
        {
            Id = expense.Id,
            MonthlyDataId = expense.MonthlyDataId,
            PaidByUserId = expense.PaidByUserId,
            PaidByUserName = user?.Name ?? "",
            Detail = expense.Detail,
            AmountARS = expense.AmountARS,
            AmountUSD = expense.AmountUSD,
            IsPaid = expense.IsPaid,
            ExpenseType = expense.ExpenseType.ToString(),
            ExternalParties = string.IsNullOrEmpty(expense.ExternalPartiesJson) 
                ? new List<string>() 
                : JsonSerializer.Deserialize<List<string>>(expense.ExternalPartiesJson)!,
            TargetUserId = expense.TargetUserId,
            TargetUserName = null
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SharedExpenseDto>> Update(Guid id, [FromBody] UpdateExpenseRequest request)
    {
        var expense = await _context.SharedExpenses.FindAsync(id);
        if (expense == null)
        {
            return NotFound();
        }

        expense.Detail = request.Detail;
        expense.AmountARS = request.AmountARS;
        expense.AmountUSD = request.AmountUSD;
        expense.IsPaid = request.IsPaid;

        // Parse ExpenseType from request (default to SplitWithAllSystemUsers)
        if (!string.IsNullOrEmpty(request.ExpenseType) && 
            Enum.TryParse<SharedExpenseType>(request.ExpenseType, out var expenseType))
        {
            expense.ExpenseType = expenseType;
        }

        // Update ExternalPartiesJson if provided
        if (request.ExternalParties != null)
        {
            expense.ExternalPartiesJson = request.ExternalParties.Count > 0 
                ? JsonSerializer.Serialize(request.ExternalParties) 
                : null;
        }

        // Update TargetUserId if provided
        if (request.TargetUserId.HasValue)
        {
            expense.TargetUserId = request.TargetUserId;
        }

        await _context.SaveChangesAsync();

        var user = await _context.Users.FindAsync(expense.PaidByUserId);

        return Ok(new SharedExpenseDto
        {
            Id = expense.Id,
            MonthlyDataId = expense.MonthlyDataId,
            PaidByUserId = expense.PaidByUserId,
            PaidByUserName = user?.Name ?? "",
            Detail = expense.Detail,
            AmountARS = expense.AmountARS,
            AmountUSD = expense.AmountUSD,
            IsPaid = expense.IsPaid,
            ExpenseType = expense.ExpenseType.ToString(),
            ExternalParties = string.IsNullOrEmpty(expense.ExternalPartiesJson) 
                ? new List<string>() 
                : JsonSerializer.Deserialize<List<string>>(expense.ExternalPartiesJson)!,
            TargetUserId = expense.TargetUserId,
            TargetUserName = null
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var expense = await _context.SharedExpenses.FindAsync(id);
        if (expense == null)
        {
            return NotFound();
        }

        _context.SharedExpenses.Remove(expense);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPut("{id}/toggle-paid")]
    public async Task<ActionResult<SharedExpenseDto>> TogglePaid(Guid id, [FromBody] TogglePaidRequest request)
    {
        var expense = await _context.SharedExpenses.FindAsync(id);
        if (expense == null)
        {
            return NotFound();
        }

        var oldValue = expense.IsPaid;
        expense.IsPaid = request.IsPaid;
        await _context.SaveChangesAsync();

        // Log activity
        var monthlyData = await _context.MonthlyData.FindAsync(expense.MonthlyDataId);
        _context.ActivityLogs.Add(new ActivityLog
        {
            UserId = expense.PaidByUserId,
            Type = ActivityType.ExpenseMarkedAsPaid,
            Description = $"Expense '{expense.Detail}' marked as {(request.IsPaid ? "paid" : "pending")}",
            EntityType = "SharedExpense",
            EntityId = expense.Id.ToString(),
            OldValue = oldValue.ToString(),
            NewValue = request.IsPaid.ToString(),
            Year = monthlyData?.Year,
            Month = monthlyData?.Month
        });
        await _context.SaveChangesAsync();

        var user = await _context.Users.FindAsync(expense.PaidByUserId);

        return Ok(new SharedExpenseDto
        {
            Id = expense.Id,
            MonthlyDataId = expense.MonthlyDataId,
            PaidByUserId = expense.PaidByUserId,
            PaidByUserName = user?.Name ?? "",
            Detail = expense.Detail,
            AmountARS = expense.AmountARS,
            AmountUSD = expense.AmountUSD,
            IsPaid = expense.IsPaid,
            ExpenseType = expense.ExpenseType.ToString(),
            ExternalParties = string.IsNullOrEmpty(expense.ExternalPartiesJson) 
                ? new List<string>() 
                : JsonSerializer.Deserialize<List<string>>(expense.ExternalPartiesJson)!,
            TargetUserId = expense.TargetUserId,
            TargetUserName = null
        });
    }

    [HttpGet("paid-by-others")]
    public async Task<ActionResult<List<SharedExpenseDto>>> GetPaidByOthers(
        [FromQuery] Guid userId,
        [FromQuery] int year,
        [FromQuery] int month)
    {
        var expenses = await _context.SharedExpenses
            .AsNoTracking()
            .Include(se => se.PaidByUser)
            .Include(se => se.MonthlyData)
            .Where(se => se.MonthlyData.UserId != userId 
                      && se.MonthlyData.Year == year 
                      && se.MonthlyData.Month == month)
            .ToListAsync();

        var dtos = expenses.Select(se => new SharedExpenseDto
        {
            Id = se.Id,
            MonthlyDataId = se.MonthlyDataId,
            PaidByUserId = se.PaidByUserId,
            PaidByUserName = se.PaidByUser.Name,
            Detail = se.Detail,
            AmountARS = se.AmountARS,
            AmountUSD = se.AmountUSD,
            IsPaid = se.IsPaid,
            ExpenseType = se.ExpenseType.ToString(),
            ExternalParties = string.IsNullOrEmpty(se.ExternalPartiesJson) 
                ? new List<string>() 
                : JsonSerializer.Deserialize<List<string>>(se.ExternalPartiesJson)!,
            TargetUserId = se.TargetUserId,
            TargetUserName = null
        }).ToList();

        return Ok(dtos);
    }

    [HttpGet("paid-for-me")]
    public async Task<ActionResult<List<SharedExpenseDto>>> GetPaidForMe(
        [FromQuery] Guid userId,
        [FromQuery] int year,
        [FromQuery] int month)
    {
        // Get expenses where:
        // 1. ExpenseType == ForSpecificSystemUser
        // 2. TargetUserId == userId
        // 3. MonthlyData.Year == year
        // 4. MonthlyData.Month == month
        // 5. Include PaidByUser for name
        
        var expenses = await _context.SharedExpenses
            .AsNoTracking()
            .Include(se => se.PaidByUser)
            .Include(se => se.MonthlyData)
            .Where(se => se.ExpenseType == SharedExpenseType.ForSpecificSystemUser
                      && se.TargetUserId == userId
                      && se.MonthlyData.Year == year
                      && se.MonthlyData.Month == month)
            .ToListAsync();

        var dtos = expenses.Select(se => new SharedExpenseDto
        {
            Id = se.Id,
            MonthlyDataId = se.MonthlyDataId,
            PaidByUserId = se.PaidByUserId,
            PaidByUserName = se.PaidByUser.Name,
            Detail = se.Detail,
            AmountARS = se.AmountARS,
            AmountUSD = se.AmountUSD,
            IsPaid = se.IsPaid,
            ExpenseType = se.ExpenseType.ToString(),
            ExternalParties = string.IsNullOrEmpty(se.ExternalPartiesJson) 
                ? new List<string>() 
                : JsonSerializer.Deserialize<List<string>>(se.ExternalPartiesJson)!,
            TargetUserId = se.TargetUserId,
            TargetUserName = null // We know current user name from context
        }).ToList();

        return Ok(dtos);
    }
}
