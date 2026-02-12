using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ExpenseTracker.Infrastructure.Data;
using ExpenseTracker.Api.DTOs;
using ExpenseTracker.Core.Entities;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MonthlyDataController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public MonthlyDataController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<MonthlyDataResponse>> GetByUserAndMonth(
        [FromQuery] Guid userId,
        [FromQuery] int year,
        [FromQuery] int month)
    {
        var monthlyData = await _context.MonthlyData
            .AsNoTracking()
            .Include(md => md.FixedExpenses)
            .Include(md => md.SharedExpensesPaidByUser)
                .ThenInclude(se => se.TargetUser)
            .Include(md => md.ThirdPartyExpenseLists)
                .ThenInclude(tpl => tpl.Expenses)
            .FirstOrDefaultAsync(md => md.UserId == userId && md.Year == year && md.Month == month);

        // Auto-create monthly data if not exists
        if (monthlyData == null)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new MonthlyDataResponse { Success = false, Error = "User not found" });
            }

            monthlyData = new MonthlyData
            {
                UserId = userId,
                Year = year,
                Month = month,
                WalletAmount = 0,
                DataCopiedFromPreviousMonth = false
            };

            _context.MonthlyData.Add(monthlyData);
            await _context.SaveChangesAsync();

            // Reload with includes
            monthlyData = await _context.MonthlyData
                .AsNoTracking()
                .Include(md => md.FixedExpenses)
                .Include(md => md.SharedExpensesPaidByUser)
                    .ThenInclude(se => se.TargetUser)
                .Include(md => md.ThirdPartyExpenseLists)
                    .ThenInclude(tpl => tpl.Expenses)
                .FirstAsync(md => md.Id == monthlyData.Id);
        }

        var dto = MapToDto(monthlyData);
        return Ok(new MonthlyDataResponse { Success = true, Data = dto });
    }

    [HttpPost]
    public async Task<ActionResult<MonthlyDataResponse>> Create([FromBody] CreateMonthlyDataRequest request)
    {
        var exists = await _context.MonthlyData
            .AnyAsync(md => md.UserId == request.UserId && md.Year == request.Year && md.Month == request.Month);

        if (exists)
        {
            return BadRequest(new MonthlyDataResponse { Success = false, Error = "Monthly data already exists for this month" });
        }

        var monthlyData = new MonthlyData
        {
            UserId = request.UserId,
            Year = request.Year,
            Month = request.Month,
            WalletAmount = 0,
            DataCopiedFromPreviousMonth = false
        };

        _context.MonthlyData.Add(monthlyData);
        await _context.SaveChangesAsync();

        var dto = MapToDto(monthlyData);
        return Ok(new MonthlyDataResponse { Success = true, Data = dto });
    }

    [HttpPut("{id}/wallet")]
    public async Task<ActionResult<MonthlyDataResponse>> UpdateWallet(Guid id, [FromBody] UpdateWalletRequest request)
    {
        var monthlyData = await _context.MonthlyData.FindAsync(id);
        if (monthlyData == null)
        {
            return NotFound(new MonthlyDataResponse { Success = false, Error = "Monthly data not found" });
        }

        monthlyData.WalletAmount = request.Amount;
        await _context.SaveChangesAsync();

        var dto = MapToDto(monthlyData);
        return Ok(new MonthlyDataResponse { Success = true, Data = dto });
    }

    [HttpPost("{id}/copy-from-previous")]
    public async Task<ActionResult<MonthlyDataResponse>> CopyFromPrevious(Guid id)
    {
        var currentData = await _context.MonthlyData
            .Include(md => md.FixedExpenses)
            .Include(md => md.SharedExpensesPaidByUser)
            .Include(md => md.ThirdPartyExpenseLists)
                .ThenInclude(tpl => tpl.Expenses)
            .FirstOrDefaultAsync(md => md.Id == id);

        if (currentData == null)
        {
            return NotFound(new MonthlyDataResponse { Success = false, Error = "Monthly data not found" });
        }

        var prevMonth = currentData.Month == 1 ? 12 : currentData.Month - 1;
        var prevYear = currentData.Month == 1 ? currentData.Year - 1 : currentData.Year;

        var prevData = await _context.MonthlyData
            .Include(md => md.FixedExpenses)
            .Include(md => md.SharedExpensesPaidByUser)
            .Include(md => md.ThirdPartyExpenseLists)
                .ThenInclude(tpl => tpl.Expenses)
            .FirstOrDefaultAsync(md => md.UserId == currentData.UserId && md.Year == prevYear && md.Month == prevMonth);

        // If previous month doesn't exist, just return current data with empty copied data
        if (prevData == null)
        {
            currentData.DataCopiedFromPreviousMonth = true;
            await _context.SaveChangesAsync();
            
            var emptyDto = MapToDto(currentData);
            return Ok(new MonthlyDataResponse { Success = true, Data = emptyDto });
        }

        // Copy fixed expenses (without paid status)
        foreach (var fe in prevData.FixedExpenses)
        {
            currentData.FixedExpenses.Add(new FixedExpense
            {
                MonthlyDataId = currentData.Id,
                Detail = fe.Detail,
                AmountARS = fe.AmountARS,
                AmountUSD = fe.AmountUSD,
                IsPaid = false
            });
        }

        // Copy shared expenses (without paid status)
        foreach (var se in prevData.SharedExpensesPaidByUser)
        {
            currentData.SharedExpensesPaidByUser.Add(new SharedExpense
            {
                MonthlyDataId = currentData.Id,
                PaidByUserId = se.PaidByUserId,
                Detail = se.Detail,
                AmountARS = se.AmountARS,
                AmountUSD = se.AmountUSD,
                IsPaid = false,
                ExpenseType = se.ExpenseType,
                ExternalPartiesJson = se.ExternalPartiesJson,
                TargetUserId = se.TargetUserId
            });
        }

        // Copy third party lists and expenses (without paid status)
        foreach (var tpl in prevData.ThirdPartyExpenseLists)
        {
            var newList = new ThirdPartyExpenseList
            {
                MonthlyDataId = currentData.Id,
                Name = tpl.Name,
                Order = tpl.Order
            };

            foreach (var tpe in tpl.Expenses)
            {
                newList.Expenses.Add(new ThirdPartyExpense
                {
                    ThirdPartyExpenseListId = newList.Id,
                    Detail = tpe.Detail,
                    AmountARS = tpe.AmountARS,
                    AmountUSD = tpe.AmountUSD,
                    IsPaid = false
                });
            }

            currentData.ThirdPartyExpenseLists.Add(newList);
        }

        currentData.WalletAmount = 0;
        currentData.DataCopiedFromPreviousMonth = true;

        await _context.SaveChangesAsync();

        // Reload to get all generated IDs
        var reloaded = await _context.MonthlyData
            .AsNoTracking()
            .Include(md => md.FixedExpenses)
            .Include(md => md.SharedExpensesPaidByUser)
                .ThenInclude(se => se.TargetUser)
            .Include(md => md.ThirdPartyExpenseLists)
                .ThenInclude(tpl => tpl.Expenses)
            .FirstAsync(md => md.Id == id);

        var resultDto = MapToDto(reloaded);
        return Ok(new MonthlyDataResponse { Success = true, Data = resultDto });
    }

    private static MonthlyDataDto MapToDto(MonthlyData md)
    {
        return new MonthlyDataDto
        {
            Id = md.Id,
            UserId = md.UserId,
            Year = md.Year,
            Month = md.Month,
            WalletAmount = md.WalletAmount,
            DataCopiedFromPreviousMonth = md.DataCopiedFromPreviousMonth,
            FixedExpenses = md.FixedExpenses.Select(fe => new FixedExpenseDto
            {
                Id = fe.Id,
                MonthlyDataId = fe.MonthlyDataId,
                Detail = fe.Detail,
                AmountARS = fe.AmountARS,
                AmountUSD = fe.AmountUSD,
                IsPaid = fe.IsPaid
            }).ToList(),
            SharedExpensesPaidByUser = md.SharedExpensesPaidByUser.Select(se => new SharedExpenseDto
            {
                Id = se.Id,
                MonthlyDataId = se.MonthlyDataId,
                PaidByUserId = se.PaidByUserId,
                Detail = se.Detail,
                AmountARS = se.AmountARS,
                AmountUSD = se.AmountUSD,
                IsPaid = se.IsPaid,
                ExpenseType = se.ExpenseType.ToString(),
                ExternalParties = string.IsNullOrEmpty(se.ExternalPartiesJson) 
                    ? new List<string>() 
                    : System.Text.Json.JsonSerializer.Deserialize<List<string>>(se.ExternalPartiesJson)!,
                TargetUserId = se.TargetUserId,
                TargetUserName = se.TargetUser?.Name
            }).ToList(),
            ThirdPartyExpenseLists = md.ThirdPartyExpenseLists.Select(tpl => new ThirdPartyExpenseListDto
            {
                Id = tpl.Id,
                MonthlyDataId = tpl.MonthlyDataId,
                Name = tpl.Name,
                Order = tpl.Order,
                Expenses = tpl.Expenses.Select(tpe => new ThirdPartyExpenseDto
                {
                    Id = tpe.Id,
                    ThirdPartyExpenseListId = tpe.ThirdPartyExpenseListId,
                    Detail = tpe.Detail,
                    AmountARS = tpe.AmountARS,
                    AmountUSD = tpe.AmountUSD,
                    IsPaid = tpe.IsPaid
                }).ToList()
            }).ToList()
        };
    }
}
