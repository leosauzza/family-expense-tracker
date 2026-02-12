using System.Text.RegularExpressions;
using ExpenseTracker.Core.Services;
using UglyToad.PdfPig;

namespace ExpenseTracker.Infrastructure.Parsers;

/// <summary>
/// Parser for BBVA Visa/Mastercard credit card statements
/// Handles highly concatenated text format
/// </summary>
public class BbvaParser : BankParserBase
{
    public override string BankName => "BBVA";
    
    public override bool CanParse(string fullText)
    {
        return fullText.Contains("BBVA", StringComparison.OrdinalIgnoreCase) ||
               fullText.Contains("OCASA - R.N.P.S.P", StringComparison.OrdinalIgnoreCase);
    }
    
    public override async Task<List<ExtractedTransaction>> ParseAsync(Stream pdfStream)
    {
        var transactions = new List<ExtractedTransaction>();
        
        pdfStream.Position = 0;
        using var document = PdfDocument.Open(pdfStream);
        
        foreach (var page in document.GetPages())
        {
            var text = page.Text;
            var dateMatches = Regex.Matches(text, @"(\d{2}-[A-Za-z]{3}-\d{2})");
            
            foreach (Match dateMatch in dateMatches)
            {
                var startIdx = dateMatch.Index;
                var nextMatch = dateMatches.Cast<Match>().FirstOrDefault(m => m.Index > startIdx);
                var endIdx = nextMatch?.Index ?? text.Length;
                
                var transactionText = text.Substring(startIdx, endIdx - startIdx).Trim();
                
                if (ShouldIgnoreLine(transactionText))
                    continue;
                
                var transaction = ParseTransaction(transactionText, dateMatch.Value);
                if (transaction != null)
                    transactions.Add(transaction);
            }
        }
        
        return await Task.FromResult(transactions);
    }
    
    private ExtractedTransaction? ParseTransaction(string text, string dateStr)
    {
        try
        {
            var dateParts = Regex.Match(dateStr, @"^(\d{2})-([A-Za-z]{3})-(\d{2})$");
            var day = int.Parse(dateParts.Groups[1].Value);
            var month = ParseSpanishMonth(dateParts.Groups[2].Value);
            var year = int.Parse(dateParts.Groups[3].Value) + 2000;
            var date = new DateTime(year, month, day);
            
            var remaining = text.Substring(dateStr.Length).Trim();
            
            // Try USD pattern first: USD + amount + cupon + ARS
            // Example: USD10,3896862510,38 -> USD 10,38 + cupon 968625 + ARS 10,38
            var usdAmount = 0m;
            string? cupon = null;
            var arsAmount = 0m;
            var descEnd = 0;
            
            var usdPattern = @"USD(\d+,\d{2})(\d{6})";
            var usdMatch = Regex.Match(remaining, usdPattern);
            
            if (usdMatch.Success)
            {
                usdAmount = ParseArgentineNumber(usdMatch.Groups[1].Value);
                cupon = usdMatch.Groups[2].Value;
                descEnd = usdMatch.Index;
                
                // ARS is immediately after cupon (no space), but we need exact match
                // Use word boundary to ensure we don't capture partial numbers
                var afterCuponPos = usdMatch.Index + usdMatch.Length;
                if (afterCuponPos < remaining.Length)
                {
                    var afterCupon = remaining.Substring(afterCuponPos);
                    // Pattern: amount at start OR amount followed by non-digit/non-comma/non-dot
                    var arsMatch = Regex.Match(afterCupon, @"^(\d{1,3}(?:\.\d{3})*,\d{2})(?:\D|$)");
                    if (arsMatch.Success)
                        arsAmount = ParseArgentineNumber(arsMatch.Groups[1].Value);
                }
            }
            else
            {
                // No USD - look for cupon + ARS at the end
                // Pattern: 6 digits + amount at end
                // But need to avoid matching reference numbers as cupon
                // Strategy: try each 6-digit sequence from right to left
                
                var sixDigitMatches = Regex.Matches(remaining, @"\d{6}");
                
                foreach (Match sixDigit in sixDigitMatches.Cast<Match>().Reverse())
                {
                    // Check if followed by amount pattern
                    var afterSix = remaining.Substring(sixDigit.Index + 6);
                    var amtMatch = Regex.Match(afterSix, @"^(\d{1,3}(?:\.\d{3})*,\d{2})\b");
                    
                    if (amtMatch.Success)
                    {
                        var potentialArs = ParseArgentineNumber(amtMatch.Groups[1].Value);
                        
                        // Validate: reasonable amount and not part of a larger number
                        if (potentialArs > 0 && potentialArs < 500000)
                        {
                            cupon = sixDigit.Value;
                            arsAmount = potentialArs;
                            descEnd = sixDigit.Index;
                            break;
                        }
                    }
                }
            }
            
            if (cupon == null || arsAmount <= 0)
                return null;
            
            // Extract and clean description
            var description = remaining.Substring(0, descEnd).Trim();
            
            // Remove trailing numbers (reference codes)
            description = Regex.Replace(description, @"[\d\s]+$", "").Trim();
            
            // Check for installment
            string? installment = null;
            var instMatch = Regex.Match(description, @"C\.(\d{2}/\d{2})");
            if (instMatch.Success)
            {
                installment = instMatch.Groups[1].Value;
                description = description.Replace(instMatch.Value, "").Trim();
            }
            
            description = CleanDescription(description);
            
            if (string.IsNullOrWhiteSpace(description))
                return null;
            
            if (!string.IsNullOrEmpty(installment))
                description = $"{description} ({installment})";
            
            return new ExtractedTransaction
            {
                Date = date,
                Description = description,
                AmountARS = arsAmount,
                AmountUSD = usdAmount,
                InstallmentInfo = installment
            };
        }
        catch
        {
            return null;
        }
    }
    
    private new static bool ShouldIgnoreLine(string line)
    {
        if (string.IsNullOrWhiteSpace(line))
            return true;
            
        var ignorePatterns = new[]
        {
            "SU PAGO", "TOTAL CONSUMOS", "SALDO ACTUAL", "INTERESES",
            "DB IVA", "IIBB PERCEP", "IVA RG", "DB.RG", "CR.RG",
            "FECHA DESCRIPCIÓN", "FECHA DESCRIPCION", "NRO. CUPÓN", "NRO. CUPON",
            "PESOS DÓLARES", "PESOS DOLARES", "Sobre (", "Legales y avisos"
        };
        
        return ignorePatterns.Any(p => line.Contains(p, StringComparison.OrdinalIgnoreCase));
    }
}
