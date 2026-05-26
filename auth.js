let piUser = null;
let accessToken = null;

async function initPi() {
  try {
    // Wait for Pi SDK initialization
    await Pi.init({
      version: "2.0",
      sandbox: false
    });

    console.log("Pi SDK initialized");

    // Auto login on app load
    await authenticateUser();

  } catch (error) {
    console.error("Pi Init Error:", error);
  }
}

async function authenticateUser() {
  try {

    const scopes = ["username"];

    const authResult = await Pi.authenticate(
      scopes,
      onIncompletePaymentFound
    );

    console.log("Auth Result:", authResult);

    piUser = authResult.user;
    accessToken = authResult.accessToken;

    // Send token to backend
    const response = await fetch("/api/auth/pi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        accessToken
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log("Backend session created");

      document.getElementById("user").innerText =
        `Welcome ${piUser.username}`;

    } else {
      console.error("Backend auth failed");
    }

  } catch (error) {
    console.error("Pi Authentication Error:", error);
  }
}

function onIncompletePaymentFound(payment) {
  console.log("Incomplete payment found:", payment);
}

// Manual sign-in button
document.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("pi-login-btn");

  if (btn) {
    btn.addEventListener("click", authenticateUser);
  }

  initPi();
});
