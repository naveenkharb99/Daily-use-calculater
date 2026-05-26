// server.js - Pi Network Payment Backend
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Pi Network API Key (your provided key)
const PI_API_KEY = process.env.PI_API_KEY || 'gsk0h9k6wasm00xsii29q0hdlnaxegnsusnnqoneqsffimgyby1gjgbt1auwg8mn';

app.use(cors());
app.use(express.json());

// Helper function to call Pi API
async function callPiAPI(endpoint, method = 'GET', body = null) {
  const url = `https://api.minepi.com/v2${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Key ${PI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(url, options);
  return await response.json();
}

// Approve payment endpoint
app.post('/api/payments/approve', async (req, res) => {
  const { paymentId } = req.body;
  
  if (!paymentId) {
    return res.status(400).json({ error: 'paymentId required' });
  }
  
  try {
    const result = await callPiAPI(`/payments/${paymentId}/approve`, 'POST', { approve: true });
    console.log(`✅ Payment ${paymentId} approved`);
    res.json(result);
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete payment endpoint
app.post('/api/payments/complete', async (req, res) => {
  const { paymentId, txid } = req.body;
  
  if (!paymentId || !txid) {
    return res.status(400).json({ error: 'paymentId and txid required' });
  }
  
  try {
    const result = await callPiAPI(`/payments/${paymentId}/complete`, 'POST', { txid });
    console.log(`✅ Payment ${paymentId} completed with txid: ${txid}`);
    res.json(result);
  } catch (error) {
    console.error('Completion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Pi API Key configured: ${PI_API_KEY ? '✅ Yes' : '❌ No'}`);
});
