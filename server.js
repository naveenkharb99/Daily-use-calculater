const express = require("express");
const axios = require("axios");
const session = require("express-session");
const cors = require("cors");

const app = express();

app.use(express.json());

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(session({
  secret: "pi-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true
  }
}));

// Pi Authentication Route
app.post("/api/auth/pi", async (req, res) => {

  try {

    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: "Missing access token"
      });
    }

    // Validate token with Pi API
    const piResponse = await axios.get(
      "https://api.minepi.com/v2/me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const piUser = piResponse.data;

    // Create session
    req.session.user = {
      uid: piUser.uid,
      username: piUser.username
    };

    return res.json({
      success: true,
      user: req.session.user
    });

  } catch (error) {

    console.error(
      "Pi verification failed:",
      error.response?.data || error.message
    );

    return res.status(401).json({
      success: false,
      error: "Invalid Pi access token"
    });
  }
});

// Test protected route
app.get("/api/me", (req, res) => {

  if (!req.session.user) {
    return res.status(401).json({
      success: false
    });
  }

  res.json({
    success: true,
    user: req.session.user
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
