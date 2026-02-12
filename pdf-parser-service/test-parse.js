/**
 * Test script for PDF parser service
 * Usage: node test-parse.js ../bbva-example.pdf
 */

import fs from 'fs';
import path from 'path';

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function testParse(filePath) {
  if (!filePath) {
    console.error('Usage: node test-parse.js <path-to-pdf>');
    process.exit(1);
  }

  const fullPath = path.resolve(filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  console.log(`Testing PDF parser with: ${fullPath}`);
  console.log(`API URL: ${API_URL}`);
  console.log('');

  try {
    // Test health endpoint first
    console.log('1. Checking health...');
    const healthRes = await fetch(`${API_URL}/health`);
    if (!healthRes.ok) {
      throw new Error('Health check failed. Is the service running?');
    }
    const health = await healthRes.json();
    console.log('   ✓ Service is healthy:', health);
    console.log('');

    // Parse PDF
    console.log('2. Parsing PDF...');
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(fullPath);
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('pdf', blob, path.basename(fullPath));

    const parseRes = await fetch(`${API_URL}/parse`, {
      method: 'POST',
      body: formData
    });

    if (!parseRes.ok) {
      const error = await parseRes.text();
      throw new Error(`Parse failed: ${error}`);
    }

    const result = await parseRes.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown parsing error');
    }

    console.log('   ✓ Parse successful!');
    console.log('');
    console.log('3. Results:');
    console.log(`   Bank: ${result.bank}`);
    console.log(`   Transactions: ${result.transactions.length}`);
    console.log('');
    
    console.log('4. Extracted transactions:');
    console.table(result.transactions.map(t => ({
      Date: t.date,
      Description: t.description.length > 30 
        ? t.description.substring(0, 30) + '...' 
        : t.description,
      'ARS': t.amountARS > 0 ? `$${t.amountARS.toFixed(2)}` : '-',
      'USD': t.amountUSD > 0 ? `U$D${t.amountUSD.toFixed(2)}` : '-',
      Installment: t.installmentInfo || '-'
    })));

    // Validation
    console.log('');
    console.log('5. Validation:');
    let issues = 0;
    
    for (const txn of result.transactions) {
      if (!txn.date) {
        console.log(`   ⚠ Transaction missing date: ${txn.description}`);
        issues++;
      }
      if (!txn.description) {
        console.log(`   ⚠ Transaction missing description`);
        issues++;
      }
      if (txn.amountARS === 0 && txn.amountUSD === 0) {
        console.log(`   ⚠ Transaction has no amount: ${txn.description}`);
        issues++;
      }
    }
    
    if (issues === 0) {
      console.log('   ✓ All transactions look valid!');
    } else {
      console.log(`   Found ${issues} potential issues`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run test
const filePath = process.argv[2];
testParse(filePath);
