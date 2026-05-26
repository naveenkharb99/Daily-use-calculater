// backend-api.js - Example Node.js/Express backend for Pi Network session validation
// Install: npm install express cors axios

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Store user sessions (in production, use a proper database)
const userSessions = new Map();

// Endpoint to validate Pi token and create session
app.post('/api/pi-auth', async (req, res) => {
  const { accessToken, username, timestamp } = req.body;
  
  if (!accessToken) {
    return res.status(400).json({ error: 'Access token required' });
  }
  
  try {
    // Validate token with Pi Network API
    const validationResponse = await axios.get('https://api.minepi.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (validationResponse.status === 200) {
      const userData = validationResponse.data;
      
      // Create session (store in memory/database)
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
        user: {
          username: userData.username,
          uid: userData.uid
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Token validation error:', error.response?.data || error.message);
    res.status(401).json({ error: 'Token validation failed' });
  }
});

// Endpoint to verify session (optional)
app.get('/api/verify-session', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  
  if (!sessionId || !userSessions.has(sessionId)) {
    return res.status(401).json({ authenticated: false });
  }
  
  const session = userSessions.get(sessionId);
  res.json({
    authenticated: true,
    username: session.username
  });
});

// Endpoint to logout
app.post('/api/logout', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  if (sessionId) {
    userSessions.delete(sessionId);
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
