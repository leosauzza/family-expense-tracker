// Polyfill for Promise.withResolvers (needed for pdfjs-dist v4 in Node.js 20)
if (!Promise.withResolvers) {
  Promise.withResolvers = function() {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { parsePdf } from './parsers/pdfParser.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'pdf-parser-service' });
});

// Parse PDF endpoint
app.post('/parse', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No PDF file provided' 
      });
    }

    const bankHint = req.body.bank; // Optional: 'bbva', 'galicia', etc.
    
    console.log(`[PDF Parser] Processing file: ${req.file.originalname}, size: ${req.file.size} bytes`);
    
    const result = await parsePdf(req.file.buffer, bankHint);
    
    console.log(`[PDF Parser] Extracted ${result.transactions.length} transactions from ${result.bank}`);
    
    res.json({
      success: true,
      bank: result.bank,
      transactions: result.transactions,
      metadata: {
        fileName: req.file.originalname,
        processedAt: new Date().toISOString(),
        transactionCount: result.transactions.length
      }
    });
    
  } catch (error) {
    console.error('[PDF Parser] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to parse PDF'
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[PDF Parser] Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`[PDF Parser Service] Running on port ${PORT}`);
});
