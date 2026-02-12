using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ExpenseTracker.Infrastructure.Data;
using ExpenseTracker.Api.DTOs;
using ExpenseTracker.Core.Entities;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FixedExpensesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public FixedExpensesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<FixedExpenseDto>> Create([FromBody] CreateExpenseRequest request)
    {
        var expense = new FixedExpense
        {
            MonthlyDataId = request.MonthlyDataId,
            Detail = request.Detail,
            AmountARS = request.AmountARS,
            AmountUSD = request.AmountUSD,
            IsPaid = request.IsPaid
        };

        _context.FixedExpenses.Add(expense);
        await _context.SaveChangesAsync();

        return Ok(new FixedExpenseDto
        {
            Id = expense.Id,
            MonthlyDataId = expense.MonthlyDataId,
            Detail = expense.Detail,
            AmountARS = expense.AmountARS,
            AmountUSD = expense.AmountUSD,
            IsPaid = expense.IsPaid
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<FixedExpenseDto>> Update(Guid id, [FromBody] UpdateExpenseRequest request)
    {
        var expense = await _context.FixedExpenses.FindAsync(id);
        if (expense == null)
        {
            return NotFound();
        }

        expense.Detail = request.Detail;
        expense.AmountARS = request.AmountARS;
        expense.AmountUSD = request.AmountUSD;
        expense.IsPaid = request.IsPaid;

        await _context.SaveChangesAsync();

        return Ok(new FixedExpenseDto
        {
            Id = expense.Id,
            MonthlyDataId = expense.MonthlyDataId,
            Detail = expense.Detail,
            AmountARS = expense.AmountARS,
            AmountUSD = expense.AmountUSD,
            IsPaid = expense.IsPaid
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var expense = await _context.FixedExpenses.FindAsync(id);
        if (expense == null)
        {
            return NotFound();
        }

        _context.FixedExpenses.Remove(expense);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPut("{id}/toggle-paid")]
    public async Task<ActionResult<FixedExpenseDto>> TogglePaid(Guid id, [FromBody] TogglePaidRequest request)
    {
        var expense = await _context.FixedExpenses.FindAsync(id);
        if (expense == null)
        {
            return NotFound();
        }

        expense.IsPaid = request.IsPaid;
        await _context.SaveChangesAsync();

        return Ok(new FixedExpenseDto
        {
            Id = expense.Id,
            MonthlyDataId = expense.MonthlyDataId,
            Detail = expense.Detail,
            AmountARS = expense.AmountARS,
            AmountUSD = expense.AmountUSD,
            IsPaid = expense.IsPaid
        });
    }
}
