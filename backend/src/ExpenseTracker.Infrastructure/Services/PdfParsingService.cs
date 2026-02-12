using ExpenseTracker.Core.Services;
using ExpenseTracker.Infrastructure.Parsers;

namespace ExpenseTracker.Infrastructure.Services;

/// <summary>
/// Service for parsing PDF credit card statements using bank-specific parsers
/// </summary>
public class PdfParsingService : IPdfParsingService
{
    private readonly List<IBankParser> _parsers;
    
    public PdfParsingService()
    {
        // Register all available parsers in priority order
        _parsers = new List<IBankParser>
        {
            new GaliciaParser(),
            new BbvaParser()
            // Add more parsers here as they are implemented
        };
    }
    
    public async Task<List<ExtractedTransaction>> ExtractTransactionsAsync(Stream pdfStream)
    {
        if (pdfStream == null || pdfStream.Length == 0)
        {
            throw new ArgumentException("PDF stream is empty", nameof(pdfStream));
        }
        
        // Ensure stream is at the beginning
        pdfStream.Position = 0;
        
        // Read the full text to detect bank
        string fullText;
        using (var document = UglyToad.PdfPig.PdfDocument.Open(pdfStream))
        {
            fullText = string.Join("\n", document.GetPages().Select(p => p.Text));
        }
        
        if (string.IsNullOrWhiteSpace(fullText))
        {
            throw new InvalidOperationException("Could not extract text from PDF. The file may be scanned or corrupted.");
        }
        
        // Find appropriate parser
        var parser = _parsers.FirstOrDefault(p => p.CanParse(fullText));
        
        if (parser == null)
        {
            throw new NotSupportedException(
                "Could not identify the bank or card type from the PDF. " +
                "Currently supported: Galicia (Visa/Mastercard), BBVA (Visa/Mastercard).");
        }
        
        // Parse using the detected parser
        // Reset stream position for the parser
        pdfStream.Position = 0;
        var transactions = await parser.ParseAsync(pdfStream);
        
        if (transactions.Count == 0)
        {
            throw new InvalidOperationException(
                $"No transactions found in the PDF using {parser.BankName} parser. " +
                "The statement format may have changed or the PDF may be invalid.");
        }
        
        // Sort by date (most recent first)
        return transactions
            .OrderByDescending(t => t.Date)
            .ToList();
    }
    
    public async Task<string?> DetectBankAsync(Stream pdfStream)
    {
        if (pdfStream == null || pdfStream.Length == 0)
        {
            return null;
        }
        
        pdfStream.Position = 0;
        
        string fullText;
        using (var document = UglyToad.PdfPig.PdfDocument.Open(pdfStream))
        {
            fullText = string.Join("\n", document.GetPages().Select(p => p.Text));
        }
        
        if (string.IsNullOrWhiteSpace(fullText))
        {
            return null;
        }
        
        var parser = _parsers.FirstOrDefault(p => p.CanParse(fullText));
        return parser?.BankName;
    }
}
