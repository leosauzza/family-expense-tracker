using System.Net.Http.Headers;
using System.Text.Json;
using ExpenseTracker.Core.Services;
using Microsoft.Extensions.Logging;

namespace ExpenseTracker.Infrastructure.Services;

/// <summary>
/// PDF Parsing service that delegates to a remote Node.js service using pdf.js
/// </summary>
public class RemotePdfParsingService : IPdfParsingService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<RemotePdfParsingService> _logger;
    private const string PARSER_SERVICE_URL = "http://pdf-parser:3001";

    public RemotePdfParsingService(ILogger<RemotePdfParsingService> logger)
    {
        _logger = logger;
        _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(30)
        };
    }

    public async Task<List<ExtractedTransaction>> ExtractTransactionsAsync(Stream pdfStream)
    {
        if (pdfStream == null || pdfStream.Length == 0)
        {
            throw new ArgumentException("PDF stream is empty", nameof(pdfStream));
        }

        try
        {
            // Reset stream position
            pdfStream.Position = 0;

            // Create multipart form content
            var content = new MultipartFormDataContent();
            
            // Add PDF file
            var streamContent = new StreamContent(pdfStream);
            streamContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
            content.Add(streamContent, "pdf", "statement.pdf");

            _logger.LogInformation("Sending PDF to parser service for analysis...");

            // Call the parser service
            var response = await _httpClient.PostAsync($"{PARSER_SERVICE_URL}/parse", content);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("PDF parser service returned error: {StatusCode} - {Error}", 
                    response.StatusCode, errorContent);
                throw new InvalidOperationException($"PDF parsing failed: {errorContent}");
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<ParserResponse>(responseJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (result == null || !result.Success)
            {
                throw new InvalidOperationException(result?.Error ?? "Unknown parsing error");
            }

            _logger.LogInformation("Successfully extracted {Count} transactions from {Bank}", 
                result.Transactions?.Count ?? 0, result.Bank);

            // Map to domain model
            var transactions = result.Transactions?.Select(t => new ExtractedTransaction
            {
                Date = DateTime.TryParse(t.Date, out var date) ? date : null,
                Description = t.Description ?? string.Empty,
                AmountARS = t.AmountARS,
                AmountUSD = t.AmountUSD,
                InstallmentInfo = t.InstallmentInfo
            }).ToList() ?? new List<ExtractedTransaction>();

            if (transactions.Count == 0)
            {
                throw new InvalidOperationException(
                    $"No transactions found in the PDF. The statement may be empty or the format may not be supported.");
            }

            return transactions;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to connect to PDF parser service");
            throw new InvalidOperationException(
                "PDF parser service is unavailable. Please ensure the service is running.", ex);
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "PDF parser service request timed out");
            throw new InvalidOperationException(
                "PDF parsing timed out. The file may be too large or the service is overloaded.", ex);
        }
    }

    public async Task<string?> DetectBankAsync(Stream pdfStream)
    {
        try
        {
            // Reset stream
            pdfStream.Position = 0;

            var content = new MultipartFormDataContent();
            var streamContent = new StreamContent(pdfStream);
            streamContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
            content.Add(streamContent, "pdf", "statement.pdf");

            var response = await _httpClient.PostAsync($"{PARSER_SERVICE_URL}/parse", content);

            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<ParserResponse>(responseJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return result?.Bank;
        }
        catch
        {
            return null;
        }
    }
}

/// <summary>
/// Response model from the parser service
/// </summary>
public class ParserResponse
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public string? Bank { get; set; }
    public List<TransactionDto>? Transactions { get; set; }
}

public class TransactionDto
{
    public string Id { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal AmountARS { get; set; }
    public decimal AmountUSD { get; set; }
    public string? InstallmentInfo { get; set; }
    public string? RawLine { get; set; }
}
