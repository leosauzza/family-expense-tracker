import { 
  parseArgentineNumber, 
  parseSpanishMonth,
  cleanDescription 
} from '../utils/pdfUtils.js';

/**
 * Galicia Credit Card Statement Parser
 * Handles position-based extraction similar to BBVA parser
 */
export function parseGalicia(pages) {
  const transactions = [];
  let inTransactionSection = false;
  
  for (const page of pages) {
    const lines = groupByY(page.items);
    
    for (const lineItems of lines) {
      const lineText = lineItems.map(item => item.str).join('');
      
      // Normalize for detection
      const normalizedText = lineText.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
      
      // Detect start of transaction section
      if (normalizedText.includes('DETALLE DEL CONSUMO')) {
        inTransactionSection = true;
        continue;
      }
      
      // Detect end of transaction section
      if (normalizedText.includes('TOTAL CONSUMOS') || 
          normalizedText.includes('TARJETA') && normalizedText.includes('TOTAL')) {
        inTransactionSection = false;
        continue;
      }
      
      if (!inTransactionSection) continue;
      if (shouldIgnoreLine(lineText)) continue;
      
      // Try to parse as transaction
      const transaction = parseTransactionLine(lineItems, lineText);
      if (transaction) {
        transactions.push(transaction);
      }
    }
  }
  
  return transactions;
}

function groupByY(items, tolerance = 3) {
  const groups = {};
  
  for (const item of items) {
    // Usar una tolerancia más alta para evitar separar elementos de la misma línea
    const y = Math.round(item.transform[5] / tolerance) * tolerance;
    if (!groups[y]) groups[y] = [];
    groups[y].push(item);
  }
  
  return Object.keys(groups)
    .sort((a, b) => b - a)
    .map(y => groups[y].sort((a, b) => a.transform[4] - b.transform[4]));
}

function shouldIgnoreLine(line) {
  const normalized = line.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  
  const ignorePatterns = [
    'SU PAGO',
    'DEV.IMP.',
    'INTERESES',
    'DB IVA',
    'IIBB PERCEP',
    'IVA RG',
    'DB.RG',
    'CR.RG',
    'BONI MANT',
    'COM MANT',
    'FECHA',
    'DESCRIPCION',
    'DESCRIPCIÓN',
    'COMPROBANTE',
    'PESOS',
    'DOLARES',
    'DÓLARES',
    'TOTAL'
  ];
  
  return ignorePatterns.some(pattern => normalized.includes(pattern));
}

function parseTransactionLine(lineItems, lineText) {
  // Galicia format: DD-MM-YY (numeric month)
  // Example: 08-09-25 * MERPAGO*PEQUENOSHINCH 05/06 060539 5.826,00
  const dateMatch = lineText.match(/(\d{2})-(\d{2})-(\d{2})/);
  if (!dateMatch) return null;
  
  // Must have a 6-digit comprobante (cupón equivalent)
  const comprobanteMatch = lineText.match(/\b(\d{6})\b/);
  if (!comprobanteMatch) return null;
  
  // Must have an amount
  const amountMatches = lineText.match(/\d{1,3}(?:\.\d{3})*,\d{2}/g);
  if (!amountMatches || amountMatches.length === 0) return null;
  
  try {
    // Parse date (DD-MM-YY format)
    const day = parseInt(dateMatch[1]);
    const month = parseInt(dateMatch[2]);
    const year = parseInt(dateMatch[3]) + 2000;
    const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // Sort by X position
    const sorted = [...lineItems].sort((a, b) => a.transform[4] - b.transform[4]);
    
    // Find comprobante position
    let comprobanteX = null;
    for (const item of sorted) {
      if (item.str === comprobanteMatch[1]) {
        comprobanteX = item.transform[4];
        break;
      }
    }
    
    if (comprobanteX === null) return null;
    
    // Find all amounts with positions
    const amounts = [];
    for (const item of sorted) {
      const match = item.str.match(/(\d{1,3}(?:\.\d{3})*,\d{2})/);
      if (match) {
        amounts.push({
          value: parseArgentineNumber(match[1]),
          x: item.transform[4],
          str: item.str
        });
      }
    }
    
    if (amounts.length === 0) return null;
    
    // Check for USD
    const isUsd = lineText.toUpperCase().includes('USD');
    
    // Split amounts by comprobante position
    const beforeComprobante = amounts.filter(a => a.x < comprobanteX);
    const afterComprobante = amounts.filter(a => a.x > comprobanteX).sort((a, b) => a.x - b.x);
    
    let arsAmount = 0;
    let usdAmount = 0;
    
    if (isUsd) {
      // For USD transactions in Galicia:
      // Format: ... USD XXX,XX comprobante XXX,XX
      // The amount after "USD" in description, and matching amount after comprobante
      
      const usdInDesc = lineText.match(/USD\s*([\d.,]+)/i);
      if (usdInDesc) {
        usdAmount = parseArgentineNumber(usdInDesc[1]);
      }
      
      // Amount after comprobante is ARS equivalent (if different from USD)
      if (afterComprobante.length > 0) {
        const afterAmount = afterComprobante[0].value;
        // If amounts are very different, the one after comprobante is ARS
        if (Math.abs(usdAmount - afterAmount) > 0.01) {
          arsAmount = afterAmount;
        }
      }
      
      // If we couldn't extract USD from description, use the amount before comprobante
      if (usdAmount === 0 && beforeComprobante.length > 0) {
        usdAmount = beforeComprobante[0].value;
      }
    } else {
      // For ARS transactions: amount is after comprobante
      if (afterComprobante.length > 0) {
        arsAmount = afterComprobante[0].value;
      } else if (beforeComprobante.length > 0) {
        arsAmount = beforeComprobante[beforeComprobante.length - 1].value;
      }
    }
    
    // Skip if no valid amounts
    if (arsAmount === 0 && usdAmount === 0) return null;
    
    // Extract description (between date and comprobante)
    let description = '';
    const dateStr = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    let foundDate = false;
    
    for (const item of sorted) {
      const text = item.str;
      const x = item.transform[4];
      
      // Skip until we pass the date
      if (!foundDate) {
        if (text.includes(dateStr)) {
          foundDate = true;
        }
        continue;
      }
      
      // Stop at comprobante
      if (x >= comprobanteX - 5) break;
      
      // Skip markers (K, *, F) at the start
      if (description === '' && /^[K\*F]\s*$/.test(text)) continue;
      
      // Skip amounts and USD marker
      if (/^\d{1,3}(?:\.\d{3})*,\d{2}$/.test(text)) continue;
      if (text.toUpperCase() === 'USD') continue;
      
      description += (description ? ' ' : '') + text;
    }
    
    description = description.trim();
    
    // Clean up
    description = description.replace(/\s+USD\s*[\d.,]*/i, ' ').trim();
    description = description.replace(/\s+\d{6}$/, ''); // Remove trailing comprobante if any
    description = cleanDescription(description);
    
    // Extract installment info (XX/YY format, usually before comprobante)
    let installmentInfo = null;
    const instMatch = description.match(/(\d{2}\/\d{2})/);
    if (instMatch) {
      installmentInfo = instMatch[1];
      description = description.replace(instMatch[0], '').trim();
    }
    
    if (!description) return null;
    
    if (installmentInfo) {
      description = `${description} (${installmentInfo})`;
    }
    
    return {
      id: 'txn_' + Math.random().toString(36).substr(2, 9),
      date,
      description,
      amountARS: arsAmount,
      amountUSD: usdAmount,
      installmentInfo
    };
    
  } catch (error) {
    console.error('[Galicia Parser] Error:', error);
    return null;
  }
}
