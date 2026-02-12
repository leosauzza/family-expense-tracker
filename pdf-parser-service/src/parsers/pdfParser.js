// Use legacy build for Node.js compatibility
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { parseBbva } from './bbvaParser.js';
import { parseGalicia } from './galiciaParser.js';

/**
 * Detects bank type from PDF content
 */
function detectBank(textContent) {
  const fullText = textContent.toUpperCase();
  
  if (fullText.includes('BBVA') || fullText.includes('OCASA - R.N.P.S.P')) {
    return 'bbva';
  }
  if (fullText.includes('GALICIA') || fullText.includes('30-50000173-5')) {
    return 'galicia';
  }
  if (fullText.includes('SANTANDER')) {
    return 'santander';
  }
  
  return 'unknown';
}

/**
 * Main PDF parsing function
 */
export async function parsePdf(pdfBuffer, bankHint = null) {
  // Load PDF document
  const data = new Uint8Array(pdfBuffer);
  const loadingTask = pdfjs.getDocument({
    data,
    useSystemFonts: true
  });
  
  const pdfDocument = await loadingTask.promise;
  
  // Extract text from all pages with positions
  const pages = [];
  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    pages.push({
      pageNum,
      items: textContent.items
    });
    page.cleanup();
  }
  
  // Detect bank type
  const sampleText = pages
    .flatMap(p => p.items)
    .map(item => item.str)
    .join(' ');
  
  const detectedBank = bankHint || detectBank(sampleText);
  
  if (detectedBank === 'unknown') {
    throw new Error('Could not detect bank type from PDF. Supported banks: BBVA, Galicia');
  }
  
  // Parse using bank-specific parser
  let transactions = [];
  
  switch (detectedBank) {
    case 'bbva':
      transactions = parseBbva(pages);
      break;
    case 'galicia':
      transactions = parseGalicia(pages);
      break;
    default:
      throw new Error(`Parser for bank "${detectedBank}" not implemented`);
  }
  
  // Sort by date (most recent first)
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return {
    bank: detectedBank,
    transactions
  };
}
