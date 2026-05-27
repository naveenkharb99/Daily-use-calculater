async function authenticateWithPi() {
  try {

    if (typeof Pi === 'undefined') {
      showStatus('❌ Open app inside Pi Browser', 'error');
      return;
    }

    showStatus('🔄 Initializing Pi SDK...', 'info');

    await Pi.init({
      version: "2.0",
      sandbox: false
    });

    showStatus('🔐 Requesting Pi permissions...', 'info');

    const scopes = ['username', 'payments'];

    const auth = await Pi.authenticate(
      scopes,
      onIncompletePaymentFound
    );

    console.log(auth);

    piAccessToken = auth.accessToken;

    piUser = auth.user;

    localStorage.setItem('pi_username', auth.user.username);
    localStorage.setItem('pi_token', auth.accessToken);

    document.getElementById('usernameDisplay').innerHTML =
      `👤 ${auth.user.username}`;

    document.getElementById('authStatus').innerHTML =
      '✅ Pi Connected';

    document.getElementById('signInBtn').style.display = 'none';

    document.getElementById('signOutBtn').style.display = 'inline-block';

    showStatus('✅ Login successful', 'success');

  } catch (error) {

    console.error(error);

    showStatus(
      `❌ ${error.message}`,
      'error'
    );
  }
}

function onIncompletePaymentFound(payment) {
  console.log("Incomplete Payment Found:", payment);
}
