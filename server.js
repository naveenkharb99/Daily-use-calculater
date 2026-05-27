// backend/server.js - Pi Network Payment Server
// Run with: node server.js
// Install: npm install express cors axios dotenv

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Pi Network API configuration
const PI_API_KEY = process.env.PI_NETWORK_API_KEY;
const PI_API_BASE = 'https://api.minepi.com/v2';

if (!PI_API_KEY) {
  console.error('❌ PI_NETWORK_API_KEY is not set in .env file');
  console.error('Please create a .env file with: PI_NETWORK_API_KEY=your_api_key_here');
  process.exit(1);
}

console.log('✅ Pi Network API Key loaded');

// Store payment sessions (in production, use a database)
const paymentSessions = new Map();

// Helper: Call Pi Network API with API Key
async function callPiAPI(endpoint, method = 'GET', data = null) {
  const url = `${PI_API_BASE}${endpoint}`;
  const config = {
    method,
    headers: {
      'Authorization': `Key ${PI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data && (method === 'POST' || method === 'PUT')) {
    config.data = data;
  }
  
  try {
    const response = await axios({ ...config, url });
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`Pi API Error (${endpoint}):`, error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message 
    };
  }
}

// Endpoint: Approve payment (called from frontend onReadyForServerApproval)
app.post('/api/payments/approve', async (req, res) => {
  const { paymentId } = req.body;
  
  if (!paymentId) {
    return res.status(400).json({ error: 'paymentId required' });
  }
  
  console.log(`📝 Approving payment: ${paymentId}`);
  
  // Call Pi Network API to approve the payment
  const result = await callPiAPI(`/payments/${paymentId}/approve`, 'POST');
  
  if (result.success) {
    console.log(`✅ Payment approved: ${paymentId}`);
    paymentSessions.set(paymentId, {
      status: 'approved',
      approvedAt: Date.now()
    });
    res.json({ success: true, payment: result.data });
  } else {
    console.error(`❌ Failed to approve payment: ${paymentId}`);
    res.status(500).json({ error: result.error });
  }
});

// Endpoint: Complete payment (called from frontend onReadyForServerCompletion)
app.post('/api/payments/complete', async (req, res) => {
  const { paymentId, txid } = req.body;
  
  if (!paymentId || !txid) {
    return res.status(400).json({ error: 'paymentId and txid required' });
  }
  
  console.log(`💰 Completing payment: ${paymentId}, txid: ${txid}`);
  
  // Call Pi Network API to complete the payment
  const result = await callPiAPI(`/payments/${paymentId}/complete`, 'POST', { txid });
  
  if (result.success) {
    console.log(`✅ Payment completed: ${paymentId}`);
    paymentSessions.set(paymentId, {
      status: 'completed',
      completedAt: Date.now(),
      txid
    });
    
    // Grant premium features to user (store in DB for production)
    // For demo, we'll return success and frontend will store in localStorage
    res.json({ 
      success: true, 
      payment: result.data,
      premiumGranted: true
    });
  } else {
    console.error(`❌ Failed to complete payment: ${paymentId}`);
    res.status(500).json({ error: result.error });
  }
});

// Endpoint: Check payment status (for recovery)
app.get('/api/payments/:paymentId/status', async (req, res) => {
  const { paymentId } = req.params;
  
  const result = await callPiAPI(`/payments/${paymentId}`, 'GET');
  
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(404).json({ error: 'Payment not found' });
  }
});

// Endpoint: Get premium status for user (based on stored sessions)
app.get('/api/premium/status', (req, res) => {
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.json({ hasPremium: false });
  }
  
  // In production, check database for user's premium status
  // For demo, we'll check localStorage equivalent via query param
  const hasPremium = req.query.hasPremium === 'true';
  
  res.json({ 
    hasPremium,
    features: {
      runToDismiss: hasPremium,
      speedTracker: hasPremium,
      dailyWeeklyRepeats: hasPremium,
      adFree: hasPremium
    }
  });
});

// Endpoint: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`🚀 Pi Payment Server running on http://localhost:${PORT}`);
  console.log(`📋 Endpoints:`);
  console.log(`   POST /api/payments/approve`);
  console.log(`   POST /api/payments/complete`);
  console.log(`   GET  /api/payments/:id/status`);
  console.log(`   GET  /api/premium/status`);
});
