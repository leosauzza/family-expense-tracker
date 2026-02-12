namespace ExpenseTracker.Core.Services;

/// <summary>
/// Represents a transaction extracted from a credit card statement
/// </summary>
public class ExtractedTransaction
{
    public string Description { get; set; } = string.Empty;
    public decimal AmountARS { get; set; }
    public decimal AmountUSD { get; set; }
    public DateTime? Date { get; set; }
    public string? InstallmentInfo { get; set; } // e.g., "05/06" for cuota 5 of 6
}

/// <summary>
/// Service for parsing PDF credit card statements
/// </summary>
public interface IPdfParsingService
{
    /// <summary>
    /// Extracts transactions from a PDF credit card statement
    /// </summary>
    /// <param name="pdfStream">PDF file stream</param>
    /// <returns>List of extracted transactions</returns>
    Task<List<ExtractedTransaction>> ExtractTransactionsAsync(Stream pdfStream);
    
    /// <summary>
    /// Detects the bank/card type from the PDF content
    /// </summary>
    /// <param name="pdfStream">PDF file stream</param>
    /// <returns>Bank name or null if unknown</returns>
    Task<string?> DetectBankAsync(Stream pdfStream);
}
