using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using ExpenseTracker.Infrastructure.Data;
using ExpenseTracker.Api.DTOs;
using ExpenseTracker.Core.Entities;
using ExpenseTracker.Core.Enums;
using ExpenseTracker.Core.Services;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CreditCardImportController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IPdfParsingService _pdfParsingService;

    public CreditCardImportController(ApplicationDbContext context, IPdfParsingService pdfParsingService)
    {
        _context = context;
        _pdfParsingService = pdfParsingService;
    }

    /// <summary>
    /// Upload and analyze a PDF credit card statement
    /// </summary>
    [HttpPost("analyze")]
    public async Task<ActionResult<List<ExtractedExpenseDto>>> AnalyzePdf(
        [FromForm] IFormFile file,
        [FromForm] Guid monthlyDataId)
    {
        // Validate file
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded");
        }

        if (!file.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase) 
            && !file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("File must be a PDF");
        }

        // Verify monthly data exists
        var monthlyData = await _context.MonthlyData.FindAsync(monthlyDataId);
        if (monthlyData == null)
        {
            return NotFound("Monthly data not found");
        }

        // Clean up old extracted expenses for this monthly data
        var oldExpenses = await _context.CreditCardExtractedExpenses
            .Where(e => e.MonthlyDataId == monthlyDataId)
            .ToListAsync();
        _context.CreditCardExtractedExpenses.RemoveRange(oldExpenses);

        // Parse PDF using the parsing service
        List<CreditCardExtractedExpense> extractedExpenses;
        try
        {
            using var stream = file.OpenReadStream();
            var transactions = await _pdfParsingService.ExtractTransactionsAsync(stream);
            
            // Convert transactions to entities
            extractedExpenses = transactions.Select(t => new CreditCardExtractedExpense
            {
                Id = Guid.NewGuid(),
                UserId = monthlyData.UserId,
                MonthlyDataId = monthlyDataId,
                Detail = t.Description,
                AmountARS = t.AmountARS,
                AmountUSD = t.AmountUSD,
                ExtractedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(24)
            }).ToList();
        }
        catch (NotSupportedException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            // Log the exception details for debugging
            return StatusCode(500, $"Error parsing PDF: {ex.Message}");
        }

        _context.CreditCardExtractedExpenses.AddRange(extractedExpenses);
        await _context.SaveChangesAsync();

        var dtos = extractedExpenses.Select(e => new ExtractedExpenseDto
        {
            Id = e.Id,
            Detail = e.Detail,
            AmountARS = e.AmountARS,
            AmountUSD = e.AmountUSD
        }).ToList();

        return Ok(dtos);
    }

    /// <summary>
    /// Confirm and create expenses from extracted data
    /// </summary>
    [HttpPost("confirm")]
    public async Task<IActionResult> ConfirmImport([FromBody] ConfirmExtractedExpensesRequest request)
    {
        // Verify monthly data exists
        var monthlyData = await _context.MonthlyData.FindAsync(request.MonthlyDataId);
        if (monthlyData == null)
        {
            return NotFound("Monthly data not found");
        }

        // Get all extracted expenses
        var extractedIds = request.Classifications.Select(c => c.ExtractedExpenseId).ToList();
        var extractedExpenses = await _context.CreditCardExtractedExpenses
            .Where(e => extractedIds.Contains(e.Id) && e.MonthlyDataId == request.MonthlyDataId)
            .ToListAsync();

        if (extractedExpenses.Count != extractedIds.Count)
        {
            return BadRequest("Some extracted expenses were not found");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            foreach (var classification in request.Classifications)
            {
                var extracted = extractedExpenses.First(e => e.Id == classification.ExtractedExpenseId);

                switch (classification.ClassificationType.ToLower())
                {
                    case "personal":
                        await CreateFixedExpense(extracted, monthlyData.Id);
                        break;

                    case "shared":
                        await CreateSharedExpense(extracted, monthlyData.Id, classification);
                        break;

                    case "otherperson":
                        await CreateOtherPersonExpense(extracted, monthlyData.Id, classification);
                        break;

                    default:
                        return BadRequest($"Invalid classification type: {classification.ClassificationType}");
                }
            }

            // Remove processed extracted expenses
            _context.CreditCardExtractedExpenses.RemoveRange(extractedExpenses);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, $"Failed to process expenses: {ex.Message}");
        }
    }

    /// <summary>
    /// Cancel import and cleanup temporary data
    /// </summary>
    [HttpDelete("cancel/{monthlyDataId}")]
    public async Task<IActionResult> CancelImport(Guid monthlyDataId)
    {
        var expenses = await _context.CreditCardExtractedExpenses
            .Where(e => e.MonthlyDataId == monthlyDataId)
            .ToListAsync();

        _context.CreditCardExtractedExpenses.RemoveRange(expenses);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task CreateFixedExpense(CreditCardExtractedExpense extracted, Guid monthlyDataId)
    {
        var expense = new FixedExpense
        {
            MonthlyDataId = monthlyDataId,
            Detail = extracted.Detail,
            AmountARS = extracted.AmountARS,
            AmountUSD = extracted.AmountUSD,
            IsPaid = false
        };

        _context.FixedExpenses.Add(expense);
        await _context.SaveChangesAsync();
    }

    private async Task CreateSharedExpense(
        CreditCardExtractedExpense extracted, 
        Guid monthlyDataId, 
        ExpenseClassification classification)
    {
        SharedExpense expense;

        if (classification.SharedWithOption == "system_family")
        {
            // Share with all system users
            expense = new SharedExpense
            {
                MonthlyDataId = monthlyDataId,
                PaidByUserId = extracted.UserId,
                Detail = extracted.Detail,
                AmountARS = extracted.AmountARS,
                AmountUSD = extracted.AmountUSD,
                IsPaid = false,
                ExpenseType = SharedExpenseType.SplitWithAllSystemUsers
            };
        }
        else
        {
            // Share with external parties
            expense = new SharedExpense
            {
                MonthlyDataId = monthlyDataId,
                PaidByUserId = extracted.UserId,
                Detail = extracted.Detail,
                AmountARS = extracted.AmountARS,
                AmountUSD = extracted.AmountUSD,
                IsPaid = false,
                ExpenseType = SharedExpenseType.SplitWithExternalParties,
                ExternalPartiesJson = JsonSerializer.Serialize(classification.ExternalPartyNames)
            };
        }

        _context.SharedExpenses.Add(expense);
        await _context.SaveChangesAsync();
    }

    private async Task CreateOtherPersonExpense(
        CreditCardExtractedExpense extracted, 
        Guid monthlyDataId, 
        ExpenseClassification classification)
    {
        if (classification.OtherPersonUserId.HasValue)
        {
            // It's a system user - create ForSpecificSystemUser expense
            var expense = new SharedExpense
            {
                MonthlyDataId = monthlyDataId,
                PaidByUserId = extracted.UserId,
                TargetUserId = classification.OtherPersonUserId,
                Detail = extracted.Detail,
                AmountARS = extracted.AmountARS,
                AmountUSD = extracted.AmountUSD,
                IsPaid = false,
                ExpenseType = SharedExpenseType.ForSpecificSystemUser
            };

            _context.SharedExpenses.Add(expense);
        }
        else if (!string.IsNullOrEmpty(classification.OtherPersonName))
        {
            // It's an external person - create ThirdPartyExpenseList if needed
            var listName = classification.OtherPersonName;
            
            // Find or create list for this person
            var list = await _context.ThirdPartyExpenseLists
                .FirstOrDefaultAsync(l => l.MonthlyDataId == monthlyDataId && l.Name == listName);

            if (list == null)
            {
                var order = await _context.ThirdPartyExpenseLists
                    .CountAsync(l => l.MonthlyDataId == monthlyDataId);

                list = new ThirdPartyExpenseList
                {
                    MonthlyDataId = monthlyDataId,
                    Name = listName,
                    Order = order + 1
                };
                _context.ThirdPartyExpenseLists.Add(list);
                await _context.SaveChangesAsync();
            }

            // Create the expense
            var expense = new ThirdPartyExpense
            {
                ThirdPartyExpenseListId = list.Id,
                Detail = extracted.Detail,
                AmountARS = extracted.AmountARS,
                AmountUSD = extracted.AmountUSD,
                IsPaid = false
            };

            _context.ThirdPartyExpenses.Add(expense);
        }

        await _context.SaveChangesAsync();
    }
}
