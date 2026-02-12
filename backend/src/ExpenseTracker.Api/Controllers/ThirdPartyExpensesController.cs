using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ExpenseTracker.Infrastructure.Data;
using ExpenseTracker.Api.DTOs;
using ExpenseTracker.Core.Entities;
using ExpenseTracker.Core.Enums;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ThirdPartyExpensesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ThirdPartyExpensesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // List operations
    [HttpPost("lists")]
    public async Task<ActionResult<ThirdPartyExpenseListDto>> CreateList([FromBody] CreateThirdPartyListRequest request)
    {
        var monthlyData = await _context.MonthlyData
            .Include(md => md.ThirdPartyExpenseLists)
            .FirstOrDefaultAsync(md => md.Id == request.MonthlyDataId);

        if (monthlyData == null)
        {
            return NotFound("Monthly data not found");
        }

        var list = new ThirdPartyExpenseList
        {
            MonthlyDataId = request.MonthlyDataId,
            Name = request.Name,
            Order = monthlyData.ThirdPartyExpenseLists.Count + 1
        };

        _context.ThirdPartyExpenseLists.Add(list);
        await _context.SaveChangesAsync();

        return Ok(new ThirdPartyExpenseListDto
        {
            Id = list.Id,
            MonthlyDataId = list.MonthlyDataId,
            Name = list.Name,
            Order = list.Order,
            Expenses = new List<ThirdPartyExpenseDto>()
        });
    }

    [HttpPut("lists/{id}/name")]
    public async Task<ActionResult<ThirdPartyExpenseListDto>> UpdateListName(Guid id, [FromBody] UpdateListNameRequest request)
    {
        var list = await _context.ThirdPartyExpenseLists.FindAsync(id);
        if (list == null)
        {
            return NotFound();
        }

        list.Name = request.Name;
        await _context.SaveChangesAsync();

        return Ok(new ThirdPartyExpenseListDto
        {
            Id = list.Id,
            MonthlyDataId = list.MonthlyDataId,
            Name = list.Name,
            Order = list.Order
        });
    }

    [HttpDelete("lists/{id}")]
    public async Task<IActionResult> DeleteList(Guid id)
    {
        var list = await _context.ThirdPartyExpenseLists.FindAsync(id);
        if (list == null)
        {
            return NotFound();
        }

        _context.ThirdPartyExpenseLists.Remove(list);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPut("lists/reorder")]
    public async Task<IActionResult> ReorderLists([FromBody] ReorderListsRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            foreach (var item in request.Items)
            {
                var list = await _context.ThirdPartyExpenseLists.FindAsync(item.Id);
                if (list != null)
                {
                    list.Order = item.Order;
                }
            }
            
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return NoContent();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // Expense operations
    [HttpPost("lists/{listId}/expenses")]
    public async Task<ActionResult<ThirdPartyExpenseDto>> CreateExpense(Guid listId, [FromBody] CreateThirdPartyExpenseRequest request)
    {
        if (listId != request.ListId)
        {
            return BadRequest("List ID mismatch");
        }

        var list = await _context.ThirdPartyExpenseLists.FindAsync(listId);
        if (list == null)
        {
            return NotFound("List not found");
        }

        var expense = new ThirdPartyExpense
        {
            ThirdPartyExpenseListId = listId,
            Detail = request.Detail,
            AmountARS = request.AmountARS,
            AmountUSD = request.AmountUSD,
            IsPaid = request.IsPaid
        };

        _context.ThirdPartyExpenses.Add(expense);
        await _context.SaveChangesAsync();

        return Ok(new ThirdPartyExpenseDto
        {
            Id = expense.Id,
            ThirdPartyExpenseListId = expense.ThirdPartyExpenseListId,
            Detail = expense.Detail,
            AmountARS = expense.AmountARS,
            AmountUSD = expense.AmountUSD,
            IsPaid = expense.IsPaid
        });
    }

    [HttpPut("expenses/{id}")]
    public async Task<ActionResult<ThirdPartyExpenseDto>> UpdateExpense(Guid id, [FromBody] UpdateExpenseRequest request)
    {
        var expense = await _context.ThirdPartyExpenses.FindAsync(id);
        if (expense == null)
        {
            return NotFound();
        }

        expense.Detail = request.Detail;
        expense.AmountARS = request.AmountARS;
        expense.AmountUSD = request.AmountUSD;
        expense.IsPaid = request.IsPaid;

        await _context.SaveChangesAsync();

        return Ok(new ThirdPartyExpenseDto
        {
            Id = expense.Id,
            ThirdPartyExpenseListId = expense.ThirdPartyExpenseListId,
            Detail = expense.Detail,
            AmountARS = expense.AmountARS,
            AmountUSD = expense.AmountUSD,
            IsPaid = expense.IsPaid
        });
    }

    [HttpDelete("expenses/{id}")]
    public async Task<IActionResult> DeleteExpense(Guid id)
    {
        var expense = await _context.ThirdPartyExpenses.FindAsync(id);
        if (expense == null)
        {
            return NotFound();
        }

        _context.ThirdPartyExpenses.Remove(expense);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPut("expenses/{id}/toggle-paid")]
    public async Task<ActionResult<ThirdPartyExpenseDto>> ToggleExpensePaid(Guid id, [FromBody] TogglePaidRequest request)
    {
        var expense = await _context.ThirdPartyExpenses.FindAsync(id);
        if (expense == null)
        {
            return NotFound();
        }

        var oldValue = expense.IsPaid;
        expense.IsPaid = request.IsPaid;
        await _context.SaveChangesAsync();

        // Log activity
        var list = await _context.ThirdPartyExpenseLists
            .Include(l => l.MonthlyData)
            .FirstOrDefaultAsync(l => l.Id == expense.ThirdPartyExpenseListId);
        
        if (list?.MonthlyData != null)
        {
            _context.ActivityLogs.Add(new ActivityLog
            {
                UserId = list.MonthlyData.UserId,
                Type = ActivityType.ExpenseMarkedAsPaid,
                Description = $"Third party expense '{expense.Detail}' marked as {(request.IsPaid ? "paid" : "pending")}",
                EntityType = "ThirdPartyExpense",
                EntityId = expense.Id.ToString(),
                OldValue = oldValue.ToString(),
                NewValue = request.IsPaid.ToString(),
                Year = list.MonthlyData.Year,
                Month = list.MonthlyData.Month
            });
            await _context.SaveChangesAsync();
        }

        return Ok(new ThirdPartyExpenseDto
        {
            Id = expense.Id,
            ThirdPartyExpenseListId = expense.ThirdPartyExpenseListId,
            Detail = expense.Detail,
            AmountARS = expense.AmountARS,
            AmountUSD = expense.AmountUSD,
            IsPaid = expense.IsPaid
        });
    }
}
