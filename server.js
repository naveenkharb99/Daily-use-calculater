// server.js - Express backend for Pi Network payments
// Install: npm install express cors axios dotenv
const scopes = ['username', 'payments'];
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// IMPORTANT: Set your Pi Network API Key in .env file
// PI_NETWORK_API_KEY=your_api_key_here
const PI_API_KEY = process.env.PI_NETWORK_API_KEY;

if (!PI_API_KEY) {
  console.error('❌ PI_NETWORK_API_KEY not set in .env file!');
  console.error('Please get your API key from Pi Network Developer Portal');
  process.exit(1);
}

console.log('✅ Pi Network API Key loaded');

// Store user sessions (in production, use a database)
const userSessions = new Map();

// Endpoint to handle Pi authentication
app.post('/api/pi-auth', async (req, res) => {
  const { accessToken, username, timestamp } = req.body;
  
  if (!accessToken) {
    return res.status(400).json({ error: 'Access token required' });
  }
  
  try {
    const validationResponse = await axios.get('https://api.minepi.com/v2/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (validationResponse.status === 200) {
      const userData = validationResponse.data;
      const sessionId = Math.random().toString(36).substring(2);
      userSessions.set(sessionId, {
        username: userData.username,
        accessToken: accessToken,
        createdAt: Date.now(),
        userData: userData
      });
      
      res.json({
        success: true,
        sessionId: sessionId,
        user: { username: userData.username, uid: userData.uid }
      });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Token validation error:', error.response?.data || error.message);
    res.status(401).json({ error: 'Token validation failed' });
  }
});

// Endpoint to approve payment (called from frontend onReadyForServerApproval)
app.post('/api/payments/approve', async (req, res) => {
  const { paymentId } = req.body;
  
  if (!paymentId) {
    return res.status(400).json({ error: 'Payment ID required' });
  }
  
  try {
    const response = await axios.post(
      `https://api.minepi.com/v2/payments/${paymentId}/approve`,
      {},
      {
        headers: {
          'Authorization': `Key ${PI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ Payment ${paymentId} approved`);
    res.json(response.data);
  } catch (error) {
    console.error('Payment approval error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Payment approval failed', details: error.response?.data });
  }
});

// Endpoint to complete payment (called from frontend onReadyForServerCompletion)
app.post('/api/payments/complete', async (req, res) => {
  const { paymentId, txid } = req.body;
  
  if (!paymentId || !txid) {
    return res.status(400).json({ error: 'Payment ID and TXID required' });
  }
  
  try {
    const response = await axios.post(
      `https://api.minepi.com/v2/payments/${paymentId}/complete`,
      { txid },
      {
        headers: {
          'Authorization': `Key ${PI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ Payment ${paymentId} completed with txid: ${txid}`);
    res.json(response.data);
  } catch (error) {
    console.error('Payment completion error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Payment completion failed', details: error.response?.data });
  }
});

// Endpoint to get payment details (for verification)
app.get('/api/payments/:paymentId', async (req, res) => {
  const { paymentId } = req.params;
  
  try {
    const response = await axios.get(
      `https://api.minepi.com/v2/payments/${paymentId}`,
      {
        headers: { 'Authorization': `Key ${PI_API_KEY}` }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Get payment error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get payment details' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📍 Payment endpoints ready for Pi Network`);
  console.log(`💡 Frontend should be served from: http://localhost:${PORT}`);
});
