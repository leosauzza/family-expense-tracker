const fs = require('fs');

// Extraído manualmente del PDF
const pdfLines = [
  "08-09-25 * MERPAGO*PEQUENOSHINCH 05/06 060539 5.826,00",
  "07-11-25 * OPTICA LOMBARDI 03/03 952311 62.700,33",
  "13-11-25 * EASY AVELLANEDA 03/03 062733 36.183,33",
  "09-12-25 * MERPAGO*MERCADOLIBRE 02/06 593322 18.420,66",
  "20-12-25 * MERPAGO*CEBRA 02/03 180423 5.663,33",
  "31-12-25 K MERPAGO*DELICIAS 489119 25.996,00",
  "01-01-26 K MERPAGO*LEANDROA 000242 1.000,00",
  "02-01-26 * FEDERACION PAT0000434184683-004-000 004683 139.016,92",
  "05-01-26 K MERPAGO*COMPLEJODEPORTIVO 799287 6.419,40",
  "05-01-26 K MERPAGO*PLENKOVICHIVANNIC 065099 42.796,00",
  "06-01-26 K MERPAGO*SUPERDIA 133305 27.376,80",
  "07-01-26 K MERPAGO*COMPLEJODEPORTIVO 218610 3.209,70",
  "09-01-26 * MERPAGO*SUPERDIA 170504 18.850,50",
  "09-01-26 K MERPAGO*HIPERCHANGOMA 154849 41.977,20",
  "09-01-26 K MERPAGO*HIPERCHANGOMA 154850 27.337,95",
  "09-01-26 * PERSONAL 300073535671001 028056 47.655,01",
  "10-01-26 K DLO*PEDIDOSYA GRIDO HE 004215 20.589,00",
  "10-01-26 K DLO*PEDIDOSYA PROPINA 003797 600,00",
  "13-01-26 K MERPAGO*DISNEYPL 569538 18.399,00",
  "14-01-26 K DLO*PEDIDOSYA PROPINA 009314 650,00",
  "14-01-26 K PEDIDOSYA*MCDONALDS AVA 000466 45.288,00",
  "15-01-26 K MERPAGO*SUPERDIA 134099 60.955,00",
  "16-01-26 * PERSONAL 300075187031001 000119 24.962,01",
  "16-01-26 F AIRBNB * HMSZC9P3RT USD 250,06 048150 250,06",
  "17-01-26 K MERPAGO*SUPERDIA 261340 26.942,50",
  "18-01-26 * MERPAGO*MCDONALDS 281192 4.499,00",
  "18-01-26 K MERPAGO*HIPERCHANGOMA 261341 46.791,30",
  "19-01-26 K MERPAGO*COMPLEJODEPORTIVO 194267 5.349,50",
  "21-01-26 * APPYPF 00364 COMBUST 426390 81.016,96",
  "21-01-26 GOOGLE *YouTubeP P1i1Newn USD 4,79 826140 4,79",
  "22-01-26 K MERPAGO*SUPERDIA 127715 27.156,50",
  "23-01-26 K MERPAGO*METROGASSA 903462 24.900,03",
  "23-01-26 K MERPAGO*SUPERDIA 167058 27.975,00",
  "25-01-26 K MERPAGO*SUPERDIA 267082 25.558,50",
  "25-01-26 K DLO*PEDIDOSYA GRIDO HE 005395 26.429,00",
  "25-01-26 K DLO*PEDIDOSYA PROPINA 009391 700,00",
  "26-01-26 * MERPAGO*TECNOLIVEUSA 01/06 729359 4.489,85",
  "26-01-26 * MERPAGO*ANDREANI 01/03 533739 3.266,65",
  "27-01-26 * MERPAGO*BIDCOM 01/06 839618 31.316,10",
  "27-01-26 * MERPAGO*PONTECSA 01/06 930227 15.346,33",
  "27-01-26 K DLO*PEDIDOSYA DELICIAS 008315 9.699,00",
  "27-01-26 K DLO*PEDIDOSYA PROPINA 000562 550,00",
  "28-01-26 STRIPE-Z.AI USD 8,10 211002 8,10"
];

// Del JSON parseado
const jsonData = JSON.parse(fs.readFileSync('./debug-result.json', 'utf8'));
const parsedDesc = jsonData.transactions.map(t => ({
  date: t.date,
  desc: t.description.toUpperCase().replace(/[^A-Z0-9]/g, ''),
  raw: t.description,
  ars: t.amountARS,
  usd: t.amountUSD
}));

console.log("=== ANÁLISIS DE DIFERENCIAS ===\n");

// Para cada línea del PDF, buscar coincidencia
pdfLines.forEach((line, idx) => {
  const dateMatch = line.match(/(\d{2})-(\d{2})-(\d{2})/);
  if (!dateMatch) return;
  
  // Extraer descripción base del PDF
  const pdfDesc = line.replace(/^\d{2}-\d{2}-\d{2}\s+[\*K]\s*/, '')
                      .replace(/\d{6,}\s+[\d\.,]+$/, '')
                      .replace(/\d{2}\/\d{2}/, '')
                      .trim()
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, '');
  
  const found = parsedDesc.find(p => {
    // Mismo día y mes
    const pDate = p.date.split('-');
    const pdfDay = dateMatch[1];
    const pdfMonth = dateMatch[2];
    const pdfYear = '20' + dateMatch[3];
    
    const sameDate = pDate[2] === pdfDay && pDate[1] === pdfMonth && pDate[0] === pdfYear;
    
    // Descripción similar
    const descMatch = pdfDesc.length > 5 && (p.desc.includes(pdfDesc.substring(0, 5)) || pdfDesc.includes(p.desc.substring(0, 5)));
    
    return sameDate && descMatch;
  });
  
  if (!found) {
    console.log(`FALTA #${idx + 1}: ${line.substring(0, 70)}`);
  }
});

console.log(`\nTotal en PDF: ${pdfLines.length}`);
console.log(`Total parseado: ${parsedDesc.length}`);
console.log(`Diferencia: ${pdfLines.length - parsedDesc.length}`);
