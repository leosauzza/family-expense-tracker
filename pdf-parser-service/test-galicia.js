/**
 * Test script for Galicia parser
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function testGalicia() {
  const fs = await import('fs');
  const path = await import('path');
  
  const filePath = '../galicia-example.pdf';
  const fullPath = path.resolve(filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  console.log(`Testing Galicia PDF parser with: ${fullPath}\n`);

  try {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(fullPath);
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('pdf', blob, path.basename(fullPath));

    const response = await fetch(`${API_URL}/parse`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Parse failed: ${error}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown parsing error');
    }

    console.log('✓ Parse successful!');
    console.log(`  Bank: ${result.bank}`);
    console.log(`  Transactions: ${result.transactions.length}`);
    console.log('');
    
    console.log('Extracted transactions:');
    console.table(result.transactions.map(t => ({
      Date: t.date,
      Description: t.description.length > 35 ? t.description.substring(0, 35) + '...' : t.description,
      'ARS': t.amountARS > 0 ? `$${t.amountARS.toLocaleString('es-AR', {minimumFractionDigits: 2})}` : '-',
      'USD': t.amountUSD > 0 ? `U$D${t.amountUSD.toFixed(2)}` : '-',
      Cuota: t.installmentInfo || '-'
    })));

    // Validation
    console.log('\nValidation:');
    let issues = 0;
    
    for (const txn of result.transactions) {
      if (!txn.date) {
        console.log(`  ⚠ Missing date: ${txn.description}`);
        issues++;
      }
      if (!txn.description) {
        console.log(`  ⚠ Missing description`);
        issues++;
      }
      if (txn.amountARS === 0 && txn.amountUSD === 0) {
        console.log(`  ⚠ No amount: ${txn.description}`);
        issues++;
      }
    }
    
    if (issues === 0) {
      console.log('  ✓ All transactions look valid!');
    } else {
      console.log(`  Found ${issues} potential issues`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testGalicia();
