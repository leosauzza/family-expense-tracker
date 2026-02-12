/**
 * Groups text items by their Y position (lines)
 * @param {Array} items - PDF text items
 * @param {number} tolerance - Y position tolerance for grouping
 * @returns {Array} Array of lines, each line is an array of items
 */
export function groupByLines(items, tolerance = 3) {
  const lines = [];
  
  for (const item of items) {
    const y = Math.round(item.transform[5] / tolerance) * tolerance;
    let line = lines.find(l => Math.abs(l.y - y) <= tolerance);
    
    if (!line) {
      line = { y, items: [] };
      lines.push(line);
    }
    
    line.items.push(item);
  }
  
  // Sort lines from top to bottom (higher Y = higher on page)
  lines.sort((a, b) => b.y - a.y);
  
  // Sort items within each line from left to right
  lines.forEach(line => {
    line.items.sort((a, b) => a.transform[4] - b.transform[4]);
  });
  
  return lines.map(l => l.items);
}

/**
 * Extracts columns from a line based on X position gaps
 * @param {Array} lineItems - Items in a single line
 * @param {number} minGap - Minimum gap to consider a new column
 * @returns {Array} Array of column strings
 */
export function extractColumns(lineItems, minGap = 15) {
  const columns = [];
  let currentCol = '';
  let prevRight = 0;
  
  for (const item of lineItems) {
    const x = item.transform[4];
    const width = item.width || 0;
    
    // Check if this is a new column (gap detected)
    if (currentCol && (x - prevRight) > minGap) {
      columns.push(currentCol.trim());
      currentCol = '';
    }
    
    // Add space if needed within same column
    if (currentCol && !currentCol.endsWith(' ') && !item.str.startsWith(' ')) {
      currentCol += ' ';
    }
    
    currentCol += item.str;
    prevRight = x + width;
  }
  
  if (currentCol) {
    columns.push(currentCol.trim());
  }
  
  return columns;
}

/**
 * Parses Argentine formatted number (1.234,56 -> 1234.56)
 * @param {string} str 
 * @returns {number}
 */
export function parseArgentineNumber(str) {
  if (!str) return 0;
  
  // Remove currency symbols and spaces
  const cleaned = str
    .replace(/[$USDAR\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Parses Spanish month abbreviation to number
 * @param {string} monthAbbr 
 * @returns {number}
 */
export function parseSpanishMonth(monthAbbr) {
  const months = {
    'ENE': 1, 'FEB': 2, 'MAR': 3, 'ABR': 4, 'MAY': 5, 'JUN': 6,
    'JUL': 7, 'AGO': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DIC': 12
  };
  return months[monthAbbr?.toUpperCase()] || 0;
}

/**
 * Cleans merchant description
 * @param {string} description 
 * @returns {string}
 */
export function cleanDescription(description) {
  if (!description) return '';
  
  // Remove common prefixes
  const prefixes = ['MERPAGO*', 'DLO*', 'CP*', 'DLOCAL*', 'APPYPF', '* '];
  let cleaned = description;
  
  for (const prefix of prefixes) {
    if (cleaned.toUpperCase().startsWith(prefix)) {
      cleaned = cleaned.substring(prefix.length);
      break;
    }
  }
  
  // Remove trailing codes (6+ digits)
  cleaned = cleaned.replace(/\s+\d{6,}\s*$/g, '');
  
  // Clean extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}
