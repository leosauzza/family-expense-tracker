import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';

const pdfPath = process.argv[2] || './bbva-example.pdf';

async function debugPdf() {
  const data = fs.readFileSync(pdfPath);
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
  
  console.log(`PDF has ${pdf.numPages} pages\n`);
  
  for (let i = 1; i <= Math.min(pdf.numPages, 2); i++) {
    console.log(`=== PAGE ${i} ===`);
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Group by Y position (lines)
    const items = textContent.items;
    const lines = {};
    
    for (const item of items) {
      const y = Math.round(item.transform[5]);
      if (!lines[y]) lines[y] = [];
      lines[y].push(item);
    }
    
    // Sort by Y (top to bottom)
    const sortedY = Object.keys(lines).sort((a, b) => b - a);
    
    for (const y of sortedY.slice(0, 30)) { // First 30 lines
      const lineItems = lines[y].sort((a, b) => a.transform[4] - b.transform[4]);
      const text = lineItems.map(i => i.str).join('');
      
      if (text.includes('FECHA') || text.includes('DESCRIP') || text.includes('CUPON') || 
          text.includes('Ene-26') || text.includes('NETFLIX')) {
        console.log(`Y=${y}: ${text.substring(0, 100)}`);
      }
    }
    
    page.cleanup();
  }
}

debugPdf().catch(console.error);
