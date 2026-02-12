using System.Globalization;
using System.Text.RegularExpressions;
using ExpenseTracker.Core.Services;
using UglyToad.PdfPig;

namespace ExpenseTracker.Infrastructure.Parsers;

/// <summary>
/// Parser for Banco Galicia Visa/Mastercard credit card statements
/// </summary>
public class GaliciaParser : BankParserBase
{
    public override string BankName => "Galicia";
    
    public override bool CanParse(string fullText)
    {
        // Check for Galicia-specific identifiers
        return fullText.Contains("Banco:", StringComparison.OrdinalIgnoreCase) &&
               (fullText.Contains("30-50000173-5", StringComparison.OrdinalIgnoreCase) ||
                fullText.Contains("Galicia", StringComparison.OrdinalIgnoreCase) ||
                fullText.Contains("Tarjeta Crédito VISA", StringComparison.OrdinalIgnoreCase));
    }
    
    public override async Task<List<ExtractedTransaction>> ParseAsync(Stream pdfStream)
    {
        var transactions = new List<ExtractedTransaction>();
        
        // Reset stream position
        pdfStream.Position = 0;
        
        using var document = PdfDocument.Open(pdfStream);
        
        // Get all text from all pages
        var fullText = string.Join(" ", document.GetPages().Select(p => p.Text));
        
        // Find the transaction section
        var consumoIndex = fullText.IndexOf("DETALLE DEL CONSUMO", StringComparison.OrdinalIgnoreCase);
        if (consumoIndex == -1)
        {
            return await Task.FromResult(transactions);
        }
        
        // Extract from "DETALLE DEL CONSUMO" to "TARJETA ... Total Consumos"
        var sectionText = fullText.Substring(consumoIndex);
        var endIndex = sectionText.IndexOf("Total Consumos", StringComparison.OrdinalIgnoreCase);
        if (endIndex != -1)
        {
            sectionText = sectionText.Substring(0, endIndex);
        }
        
        // Pattern to match Galicia transactions:
        // Date format: DD-MM-YY followed by description, optional cuota (NN/MM), comprobante, and amounts
        var datePattern = @"(\d{2}-\d{2}-\d{2})";
        var matches = Regex.Matches(sectionText, datePattern);
        
        foreach (Match dateMatch in matches)
        {
            var startIndex = dateMatch.Index;
            
            // Find the end of this transaction (start of next date or end of text)
            int endPos;
            var nextMatch = matches.Cast<Match>().FirstOrDefault(m => m.Index > startIndex);
            if (nextMatch != null)
            {
                endPos = nextMatch.Index;
            }
            else
            {
                endPos = sectionText.Length;
            }
            
            var transactionText = sectionText.Substring(startIndex, endPos - startIndex).Trim();
            
            // Skip if it's a header or footer line
            if (ShouldIgnoreLine(transactionText))
                continue;
            
            var transaction = ParseTransactionLine(transactionText);
            if (transaction != null && (transaction.AmountARS != 0 || transaction.AmountUSD != 0))
            {
                transactions.Add(transaction);
            }
        }
        
        return await Task.FromResult(transactions);
    }
    
    private ExtractedTransaction? ParseTransactionLine(string line)
    {
        try
        {
            // Match date pattern at start: DD-MM-YY
            var dateMatch = Regex.Match(line, @"^(\d{2})-(\d{2})-(\d{2})");
            if (!dateMatch.Success)
                return null;
                
            var day = int.Parse(dateMatch.Groups[1].Value);
            var month = int.Parse(dateMatch.Groups[2].Value);
            var year = int.Parse(dateMatch.Groups[3].Value) + 2000;
            
            var date = new DateTime(year, month, day);
            
            // Remove date from line for further parsing
            var remaining = line.Substring(dateMatch.Length).Trim();
            
            // Skip markers at the beginning
            if (remaining.StartsWith("K") || remaining.StartsWith("*") || remaining.StartsWith("F"))
            {
                remaining = remaining.Substring(1).Trim();
            }
            
            // Check if this is a USD transaction
            bool isUsd = remaining.Contains("USD", StringComparison.OrdinalIgnoreCase);
            
            if (isUsd)
            {
                return ParseUsdTransaction(remaining, date);
            }
            else
            {
                return ParseArsTransaction(remaining, date);
            }
        }
        catch
        {
            return null;
        }
    }
    
    private ExtractedTransaction? ParseArsTransaction(string remaining, DateTime date)
    {
        try
        {
            // Look for installment pattern XX/YY
            string? installmentInfo = null;
            var installmentMatch = Regex.Match(remaining, @"(\d{2}/\d{2})");
            if (installmentMatch.Success)
            {
                installmentInfo = installmentMatch.Groups[1].Value;
            }
            
            // Find the last valid amount in the text
            var amountResult = FindLastValidAmount(remaining);
            if (amountResult == null)
                return null;
                
            var amount = amountResult.Value.amount;
            var amountPosition = amountResult.Value.position;
            
            // Extract description (everything before the amount, excluding reference numbers)
            string description = "";
            if (amountPosition > 0)
            {
                description = remaining.Substring(0, amountPosition).Trim();
                
                // Remove 6-digit comprobante numbers at the end of description
                description = Regex.Replace(description, @"\s+\d{6}$", "").Trim();
                // Remove installment info from description if present (it's already captured)
                if (installmentInfo != null)
                {
                    description = description.Replace(installmentInfo, "").Trim();
                }
            }
            
            description = CleanDescription(description);
            
            if (string.IsNullOrWhiteSpace(description))
                return null;
            
            // Add installment info to description
            if (!string.IsNullOrEmpty(installmentInfo))
            {
                description = $"{description} ({installmentInfo})";
            }
            
            return new ExtractedTransaction
            {
                Date = date,
                Description = description,
                AmountARS = amount,
                AmountUSD = 0,
                InstallmentInfo = installmentInfo
            };
        }
        catch
        {
            return null;
        }
    }
    
    private ExtractedTransaction? ParseUsdTransaction(string remaining, DateTime date)
    {
        try
        {
            // Extract USD amount - look for "USD" followed by amount
            var usdMatch = Regex.Match(remaining, @"USD\s+([\d]{1,3}(?:\.[\d]{3})*,[\d]{2})");
            if (!usdMatch.Success)
                return null;
                
            var amountStr = usdMatch.Groups[1].Value;
            var amount = ParseArgentineNumber(amountStr);
            
            // Get description (everything before "USD")
            var usdIndex = remaining.IndexOf("USD", StringComparison.OrdinalIgnoreCase);
            var description = remaining.Substring(0, usdIndex).Trim();
            
            // Remove trailing numbers that might be comprobantes
            description = Regex.Replace(description, @"\s+\d{6,15}$", "").Trim();
            
            description = CleanDescription(description);
            
            if (string.IsNullOrWhiteSpace(description))
                return null;
                
            return new ExtractedTransaction
            {
                Date = date,
                Description = description,
                AmountARS = 0,
                AmountUSD = amount
            };
        }
        catch
        {
            return null;
        }
    }
}
