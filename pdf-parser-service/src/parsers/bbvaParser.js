import { 
  parseArgentineNumber, 
  parseSpanishMonth,
  cleanDescription 
} from '../utils/pdfUtils.js';

/**
 * BBVA Credit Card Statement Parser
 * Parses transactions without requiring header detection
 */
export function parseBbva(pages) {
  const transactions = [];
  let pendingDateLine = null;
  
  for (const page of pages) {
    const lines = groupByY(page.items);
    
    for (let i = 0; i < lines.length; i++) {
      const lineItems = lines[i];
      const lineText = lineItems.map(item => item.str).join('');
      
      // Skip headers, footers, and non-transaction lines
      if (shouldIgnoreLine(lineText)) {
        pendingDateLine = null;
        continue;
      }
      
      // Skip section headers
      if (isSectionHeader(lineText)) {
        continue;
      }
      
      // Check if this line is just a date (will be merged with next line)
      const dateOnlyMatch = lineText.match(/^(\d{2})-([A-Za-z]{3})-(\d{2})\s*$/);
      if (dateOnlyMatch && !lineText.match(/\d{6}/)) {
        pendingDateLine = { lineItems, lineText, dateMatch: dateOnlyMatch };
        continue;
      }
      
      // Check if this line has cupón but no amount (amount is on next line)
      // Pattern: date + description + cupón (6 digits) at end, no amount
      const hasCuponAtEnd = lineText.match(/\d{6}\s*$/);
      const hasAmount = lineText.match(/\d{1,3}(?:\.\d{3})*,\d{2}/);
      if (hasCuponAtEnd && !hasAmount) {
        // Store this line and merge with next line (which should have the amount)
        const dateMatch = lineText.match(/(\d{2})-([A-Za-z]{3})-(\d{2})/);
        if (dateMatch) {
          pendingDateLine = { lineItems, lineText, dateMatch };
          continue;
        }
      }
      
      // Try to parse as transaction
      let transaction = null;
      
      if (pendingDateLine) {
        // Merge pending date line with current line
        const mergedItems = [...pendingDateLine.lineItems, ...lineItems];
        const mergedText = pendingDateLine.lineText + lineText;
        transaction = parseTransactionLine(mergedItems, mergedText, pendingDateLine.dateMatch);
        pendingDateLine = null;
      } else {
        // Try single line transaction
        const dateMatch = lineText.match(/(\d{2})-([A-Za-z]{3})-(\d{2})/);
        if (dateMatch) {
          transaction = parseTransactionLine(lineItems, lineText, dateMatch);
        }
      }
      
      if (transaction) {
        transactions.push(transaction);
      }
    }
  }
  
  return transactions;
}

function groupByY(items, tolerance = 2) {
  const groups = {};
  
  for (const item of items) {
    const y = Math.round(item.transform[5] / tolerance) * tolerance;
    if (!groups[y]) groups[y] = [];
    groups[y].push(item);
  }
  
  return Object.keys(groups)
    .sort((a, b) => b - a)
    .map(y => groups[y].sort((a, b) => a.transform[4] - b.transform[4]));
}

function isSectionHeader(line) {
  const normalized = line.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  return normalized.includes('FECHA') && normalized.includes('DESCRIPCION') && normalized.includes('CUPON');
}

function shouldIgnoreLine(line) {
  const upper = line.toUpperCase();
  const ignore = [
    'SU PAGO', 'TOTAL CONSUMOS', 'SALDO ACTUAL', 'SALDO ANTERIOR',
    'INTERESES', 'DB IVA', 'IIBB PERCEP', 'IVA RG', 'DB.RG', 'CR.RG',
    'PAGO MÍNIMO', 'TASAS', 'CONSOLIDADO', 'SOBRE (', 'LEGALES Y AVISOS',
    'TARJETA DE CRÉDITO', 'RESUMEN', 'CANCELACION'
  ];
  return ignore.some(p => upper.includes(p));
}

function parseTransactionLine(lineItems, lineText, dateMatch) {
  // Must have cupón (6 digits) - but be careful with false positives
  const cuponMatch = lineText.match(/\b(\d{6})\b/);
  if (!cuponMatch) return null;
  
  // Additional validation: must have an amount in Argentine format
  const amountMatches = lineText.match(/\d{1,3}(?:\.\d{3})*,\d{2}/g);
  if (!amountMatches || amountMatches.length === 0) return null;
  
  try {
    // Parse date
    const day = parseInt(dateMatch[1]);
    const month = parseSpanishMonth(dateMatch[2]);
    const year = parseInt(dateMatch[3]) + 2000;
    const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // Sort by X position
    const sorted = [...lineItems].sort((a, b) => a.transform[4] - b.transform[4]);
    
    // Find cupón position
    let cuponX = null;
    for (const item of sorted) {
      if (item.str === cuponMatch[1]) {
        cuponX = item.transform[4];
        break;
      }
    }
    
    if (cuponX === null) return null;
    
    // Find all amounts with their positions
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
    
    // Check for USD indicator
    const isUsd = lineText.toUpperCase().includes('USD');
    
    // Split amounts by cupón position
    const beforeCupon = amounts.filter(a => a.x < cuponX);
    const afterCupon = amounts.filter(a => a.x > cuponX).sort((a, b) => a.x - b.x);
    
    let arsAmount = 0;
    let usdAmount = 0;
    
    if (isUsd) {
      // For USD transactions, look for USD amount in description first
      const usdInDescMatch = lineText.match(/USD\s*([\d.,]+)/i);
      if (usdInDescMatch) {
        usdAmount = parseArgentineNumber(usdInDescMatch[1]);
      }
      
      // After cupón: typically [optional ARS equivalent] [USD amount]
      // The rightmost amount after cupón is always USD
      if (afterCupon.length >= 1) {
        const rightmostAmount = afterCupon[afterCupon.length - 1].value;
        
        // If we already have USD from description, compare to see if they're the same
        if (usdAmount > 0) {
          // If the amounts are very close, it's the same value shown twice
          // Don't duplicate as ARS
          if (Math.abs(usdAmount - rightmostAmount) < 0.01) {
            // Same value - it's just the USD column, no ARS equivalent
            arsAmount = 0;
          } else {
            // Different values: left is ARS equivalent, right is USD
            if (afterCupon.length >= 2) {
              arsAmount = afterCupon[0].value;
              usdAmount = afterCupon[1].value;
            } else {
              // Only one amount - use it as USD
              usdAmount = rightmostAmount;
            }
          }
        } else {
          // No USD in description, use rightmost as USD
          usdAmount = rightmostAmount;
        }
      }
    } else {
      // For ARS transactions: take the amount after cupón (Pesos column)
      // If no amount after cupón, take the last amount before cupón
      if (afterCupon.length > 0) {
        arsAmount = afterCupon[0].value;
      } else if (beforeCupon.length > 0) {
        arsAmount = beforeCupon[beforeCupon.length - 1].value;
      }
    }
    
    // Skip if no valid amounts
    if (arsAmount === 0 && usdAmount === 0) return null;
    
    // Extract description (between date and cupón)
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
      
      // Stop at cupón
      if (x >= cuponX - 5) break;
      
      // Skip amounts and USD marker
      if (/^\d{1,3}(?:\.\d{3})*,\d{2}$/.test(text)) continue;
      if (text.toUpperCase() === 'USD') continue;
      
      description += (description ? ' ' : '') + text;
    }
    
    description = description.trim();
    
    // Clean up description
    description = description.replace(/\s+USD\s*[\d.,]*/i, ' ').trim();
    description = description.replace(/\s+\d{9,}$/, ''); // Remove long numeric IDs
    description = description.replace(/\s+[A-Za-z0-9]{8,}$/, ''); // Remove codes
    description = cleanDescription(description);
    
    // Extract installment info (C.XX/YY)
    let installmentInfo = null;
    const instMatch = description.match(/C\.(\d{2}\/\d{2})/);
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
    console.error('[BBVA Parser] Error:', error);
    return null;
  }
}
