using System.Text.RegularExpressions;
using ExpenseTracker.Core.Services;

namespace ExpenseTracker.Infrastructure.Parsers;

/// <summary>
/// Interface for bank-specific credit card statement parsers
/// </summary>
public interface IBankParser
{
    /// <summary>
    /// Bank/card name this parser handles
    /// </summary>
    string BankName { get; }
    
    /// <summary>
    /// Checks if this parser can handle the given PDF content
    /// </summary>
    /// <param name="fullText">Full text extracted from PDF</param>
    /// <returns>True if this parser can handle the statement</returns>
    bool CanParse(string fullText);
    
    /// <summary>
    /// Parses transactions from the PDF stream
    /// </summary>
    /// <param name="pdfStream">PDF file stream</param>
    /// <returns>List of extracted transactions</returns>
    Task<List<ExtractedTransaction>> ParseAsync(Stream pdfStream);
}

/// <summary>
/// Base class for bank parsers with common functionality
/// </summary>
public abstract class BankParserBase : IBankParser
{
    public abstract string BankName { get; }
    public abstract bool CanParse(string fullText);
    public abstract Task<List<ExtractedTransaction>> ParseAsync(Stream pdfStream);
    
    /// <summary>
    /// Converts Spanish month abbreviation to month number
    /// </summary>
    protected static int ParseSpanishMonth(string monthAbbr)
    {
        var monthMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            ["Ene"] = 1, ["Feb"] = 2, ["Mar"] = 3, ["Abr"] = 4,
            ["May"] = 5, ["Jun"] = 6, ["Jul"] = 7, ["Ago"] = 8,
            ["Sep"] = 9, ["Oct"] = 10, ["Nov"] = 11, ["Dic"] = 12
        };
        
        return monthMap.TryGetValue(monthAbbr.Trim(), out var month) ? month : 0;
    }
    
    /// <summary>
    /// Parses Argentine formatted number (e.g., "1.234,56" -> 1234.56)
    /// </summary>
    protected static decimal ParseArgentineNumber(string numberStr)
    {
        if (string.IsNullOrWhiteSpace(numberStr))
            return 0;
            
        // Remove any currency symbols and whitespace
        numberStr = numberStr.Trim()
            .Replace("$", "")
            .Replace("USD", "")
            .Replace("AR$", "")
            .Trim();
            
        // Argentine format: 1.234,56 -> remove dots, replace comma with dot
        numberStr = numberStr.Replace(".", "").Replace(",", ".");
        
        if (decimal.TryParse(numberStr, System.Globalization.NumberStyles.Any, 
            System.Globalization.CultureInfo.InvariantCulture, out var result))
        {
            return result;
        }
        
        return 0;
    }
    
    /// <summary>
    /// Finds the last valid Argentine amount in a string, handling cases where
    /// numbers are concatenated together (e.g., "83961831.316,10" -> 31316.10)
    /// </summary>
    protected static (decimal amount, int position, int length)? FindLastValidAmount(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return null;
        
        // Strategy: Find the RIGHTMOST valid amount pattern that gives a reasonable value.
        // When numbers are concatenated (e.g., "83961831.316,10"), we want the RIGHTMOST
        // valid amount pattern, which would be "31.316,10", not "831.316,10".
        
        // Pattern for Argentine amounts: XXX.XXX,XX or XX.XXX,XX or X.XXX,XX or XXX,XX
        var pattern = @"\d{1,3}(?:\.\d{3})*,\d{2}";
        
        // Search from right to left by reversing the search
        int searchPos = text.Length;
        while (searchPos > 0)
        {
            // Find the last match that ends at or before searchPos
            Match? lastMatch = null;
            foreach (Match m in Regex.Matches(text.Substring(0, searchPos), pattern))
            {
                lastMatch = m;
            }
            
            if (lastMatch == null)
                break;
            
            var matchValue = lastMatch.Value;
            var matchStart = lastMatch.Index;
            
            // Try this match as the amount
            var amount = ParseArgentineNumber(matchValue);
            
            // Check if it's a reasonable credit card transaction amount
            // Using 300k as upper limit - most transactions are under this
            // Note: Due to PDF parsing issues with concatenated numbers, some
            // amounts may be incorrect. This is a known limitation.
            if (amount > 0 && amount < 300000)
            {
                return (amount, matchStart, matchValue.Length);
            }
            
            // This match gives an unreasonable amount, try the next one to the left
            searchPos = matchStart + matchValue.IndexOf(','); // Move left past this match's decimal
        }
        
        return null;
    }
    
    /// <summary>
    /// Cleans up merchant description
    /// </summary>
    protected static string CleanDescription(string description)
    {
        if (string.IsNullOrWhiteSpace(description))
            return string.Empty;
            
        // Remove common prefixes
        var prefixes = new[] { "MERPAGO*", "DLO*", "CP*", "DLOCAL*", "APPYPF", "* " };
        foreach (var prefix in prefixes)
        {
            if (description.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                description = description.Substring(prefix.Length);
                break;
            }
        }
        
        // Clean up extra whitespace
        description = System.Text.RegularExpressions.Regex.Replace(description.Trim(), @"\s+", " ");
        
        return description;
    }
    
    /// <summary>
    /// Checks if a line should be ignored (payments, fees, etc.)
    /// </summary>
    protected static bool ShouldIgnoreLine(string line)
    {
        if (string.IsNullOrWhiteSpace(line))
            return true;
            
        var ignorePatterns = new[]
        {
            "SU PAGO",
            "INTERESES",
            "DB IVA",
            "IIBB PERCEP",
            "IVA RG",
            "DB.RG",
            "CR.RG",
            "TOTAL CONSUMOS",
            "SALDO ACTUAL",
            "SALDO ANTERIOR",
            "PAGO MINIMO",
            "TASAS",
            "CONSOLIDADO",
            "Resumen de tarjeta",
            "Página",
            "FECHA REFERENCIA",
            "FECHA DESCRIPCIÓN"
        };
        
        return ignorePatterns.Any(pattern => 
            line.Contains(pattern, StringComparison.OrdinalIgnoreCase));
    }
}
