/**
 * Test script for BBVA parser logic
 * Simulates the parsing without needing the full PDF.js setup
 */

// Simulated line items from the PDF
const testCases = [
  {
    name: "Netflix USD",
    lineText: "04-Ene-26 NETFLIX.COM M2wgWnC6RUSD 10,38 968625 10,38",
    // Simulated items with X positions (approximate based on PDF structure)
    items: [
      { str: "04-Ene-26", transform: [0, 0, 0, 0, 45, 500], width: 50 },
      { str: "NETFLIX.COM", transform: [0, 0, 0, 0, 120, 500], width: 70 },
      { str: "M2wgWnC6RUSD", transform: [0, 0, 0, 0, 200, 500], width: 80 },
      { str: "10,38", transform: [0, 0, 0, 0, 290, 500], width: 30 },  // USD amount in description
      { str: "968625", transform: [0, 0, 0, 0, 380, 500], width: 40 },  // Cupón
      { str: "10,38", transform: [0, 0, 0, 0, 550, 500], width: 30 }   // Dólares column
    ],
    expected: {
      description: "NETFLIX.COM",
      amountARS: 0,  // No ARS for USD-only transaction
      amountUSD: 10.38
    }
  },
  {
    name: "Racing Club ARS",
    lineText: "04-Ene-26 RACING CLUB 202601000074709 000001 29.400,00",
    items: [
      { str: "04-Ene-26", transform: [0, 0, 0, 0, 45, 480], width: 50 },
      { str: "RACING", transform: [0, 0, 0, 0, 120, 480], width: 50 },
      { str: "CLUB", transform: [0, 0, 0, 0, 175, 480], width: 35 },
      { str: "202601000074709", transform: [0, 0, 0, 0, 220, 480], width: 100 },
      { str: "000001", transform: [0, 0, 0, 0, 380, 480], width: 40 },  // Cupón
      { str: "29.400,00", transform: [0, 0, 0, 0, 460, 480], width: 50 } // Pesos column
    ],
    expected: {
      description: "RACING CLUB",
      amountARS: 29400.00,
      amountUSD: 0
    }
  },
  {
    name: "Microsoft Game Pass USD",
    lineText: "19-Ene-26 MICROSOFT*PC GAME PASS USD 10,58 001508 10,58",
    items: [
      { str: "19-Ene-26", transform: [0, 0, 0, 0, 45, 400], width: 50 },
      { str: "MICROSOFT*PC", transform: [0, 0, 0, 0, 120, 400], width: 80 },
      { str: "GAME", transform: [0, 0, 0, 0, 205, 400], width: 35 },
      { str: "PASS", transform: [0, 0, 0, 0, 245, 400], width: 35 },
      { str: "USD", transform: [0, 0, 0, 0, 285, 400], width: 25 },
      { str: "10,58", transform: [0, 0, 0, 0, 315, 400], width: 30 },  // USD in description
      { str: "001508", transform: [0, 0, 0, 0, 380, 400], width: 40 },  // Cupón
      { str: "10,58", transform: [0, 0, 0, 0, 550, 400], width: 30 }   // Dólares column
    ],
    expected: {
      description: "MICROSOFT*PC GAME PASS",
      amountARS: 0,
      amountUSD: 10.58
    }
  },
  {
    name: "Cuota transaction",
    lineText: "12-Nov-25 ENIGMA TICKETS FTM C.03/06 000107 47.500,04",
    items: [
      { str: "12-Nov-25", transform: [0, 0, 0, 0, 45, 520], width: 50 },
      { str: "ENIGMA", transform: [0, 0, 0, 0, 120, 520], width: 50 },
      { str: "TICKETS", transform: [0, 0, 0, 0, 175, 520], width: 55 },
      { str: "FTM", transform: [0, 0, 0, 0, 235, 520], width: 30 },
      { str: "C.03/06", transform: [0, 0, 0, 0, 270, 520], width: 50 },
      { str: "000107", transform: [0, 0, 0, 0, 380, 520], width: 40 },  // Cupón
      { str: "47.500,04", transform: [0, 0, 0, 0, 460, 520], width: 50 } // Pesos
    ],
    expected: {
      description: "ENIGMA TICKETS FTM (03/06)",
      amountARS: 47500.04,
      amountUSD: 0,
      installment: "03/06"
    }
  }
];

// Helper functions (copied from pdfUtils.js)
function parseArgentineNumber(str) {
  if (!str) return 0;
  const cleaned = str
    .replace(/[$USDAR\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseSpanishMonth(monthAbbr) {
  const months = {
    'ENE': 1, 'FEB': 2, 'MAR': 3, 'ABR': 4, 'MAY': 5, 'JUN': 6,
    'JUL': 7, 'AGO': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DIC': 12
  };
  return months[monthAbbr?.toUpperCase()] || 0;
}

function cleanDescription(description) {
  if (!description) return '';
  const prefixes = ['MERPAGO*', 'DLO*', 'CP*', 'DLOCAL*', 'APPYPF', '* '];
  let cleaned = description;
  for (const prefix of prefixes) {
    if (cleaned.toUpperCase().startsWith(prefix)) {
      cleaned = cleaned.substring(prefix.length);
      break;
    }
  }
  cleaned = cleaned.replace(/\s+\d{6,}\s*$/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

// Simplified BBVA parser logic for testing
function parseTestCase(testCase) {
  const { lineText, items } = testCase;
  
  // Parse date
  const dateMatch = lineText.match(/(\d{2})-([A-Za-z]{3})-(\d{2})/);
  if (!dateMatch) return null;
  
  const day = parseInt(dateMatch[1]);
  const month = parseSpanishMonth(dateMatch[2]);
  const year = parseInt(dateMatch[3]) + 2000;
  const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  
  // Column boundaries (approximate for BBVA)
  const bounds = {
    dateEnd: 80,
    descriptionEnd: 350,
    cuponEnd: 420,
    pesosStart: 430,
    pesosEnd: 520,
    dolaresStart: 530
  };
  
  // Sort by X
  const sorted = [...items].sort((a, b) => a.transform[4] - b.transform[4]);
  
  let description = '';
  let cupon = '';
  let pesosAmount = '';
  let dolaresAmount = '';
  
  for (const item of sorted) {
    const x = item.transform[4];
    const text = item.str.trim();
    
    if (/\d{2}-[A-Za-z]{3}-\d{2}/.test(text)) continue;
    
    // Description: between date end and cupon
    if (x > bounds.dateEnd && x < bounds.cuponEnd) {
      if (!/^\d{6}$/.test(text)) {
        description += (description ? ' ' : '') + text;
      }
    }
    
    // Cupón
    if (/^\d{6}$/.test(text) && x > 350 && x < bounds.pesosStart) {
      cupon = text;
    }
    
    // Pesos
    if (x >= bounds.pesosStart && x < bounds.pesosEnd) {
      if (/\d{1,3}(?:\.\d{3})*,\d{2}/.test(text)) {
        pesosAmount = text;
      }
    }
    
    // Dólares
    if (x >= bounds.dolaresStart) {
      if (/\d{1,3}(?:\.\d{3})*,\d{2}/.test(text)) {
        dolaresAmount = text;
      }
    }
  }
  
  let arsAmount = parseArgentineNumber(pesosAmount);
  let usdAmount = parseArgentineNumber(dolaresAmount);
  
  const isUsdTransaction = description.toUpperCase().includes('USD') || usdAmount > 0;
  
  // If USD transaction but no USD captured, check description
  if (isUsdTransaction && usdAmount === 0) {
    const usdMatch = description.match(/USD\s*([\d.,]+)/i);
    if (usdMatch) {
      usdAmount = parseArgentineNumber(usdMatch[1]);
    }
  }
  
  // Clean description
  description = description.replace(/\s*\d*\s*USD\s*[\d.,]+\s*/i, ' ').trim();
  description = description.replace(/\s+/, ' ').trim();
  description = description.replace(/\s+[A-Za-z0-9]{8,}$/, '');
  description = cleanDescription(description);
  
  // Extract installment
  let installmentInfo = null;
  const instMatch = description.match(/C\.(\d{2}\/\d{2})/);
  if (instMatch) {
    installmentInfo = instMatch[1];
    description = description.replace(instMatch[0], '').trim();
  }
  
  if (installmentInfo) {
    description = `${description} (${installmentInfo})`;
  }
  
  return {
    date,
    description,
    amountARS: arsAmount,
    amountUSD: usdAmount,
    installmentInfo,
    cupon
  };
}

// Run tests
console.log('BBVA Parser Logic Test\n');
console.log('=' .repeat(60));

let passed = 0;
let failed = 0;

for (const test of testCases) {
  console.log(`\nTest: ${test.name}`);
  console.log(`Input: ${test.lineText}`);
  
  const result = parseTestCase(test);
  
  console.log('Result:');
  console.log(`  Description: ${result.description}`);
  console.log(`  ARS: ${result.amountARS}`);
  console.log(`  USD: ${result.amountUSD}`);
  if (result.installmentInfo) console.log(`  Cuota: ${result.installmentInfo}`);
  
  // Validate
  const descOk = result.description === test.expected.description;
  const arsOk = result.amountARS === test.expected.amountARS;
  const usdOk = result.amountUSD === test.expected.amountUSD;
  
  if (descOk && arsOk && usdOk) {
    console.log('✅ PASS');
    passed++;
  } else {
    console.log('❌ FAIL');
    console.log('Expected:');
    console.log(`  Description: ${test.expected.description}`);
    console.log(`  ARS: ${test.expected.amountARS}`);
    console.log(`  USD: ${test.expected.amountUSD}`);
    failed++;
  }
}

console.log('\n' + '='.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
