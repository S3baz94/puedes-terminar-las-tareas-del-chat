import app from './index.js';
import { db } from './database.js';

const PORT = 3002;
const server = app.listen(PORT, async () => {
  console.log(`Test server running on port ${PORT}`);
  try {
    // Test Login
    console.log('\n--- Test 1: POST /api/auth/login ---');
    const loginRes = await fetch(`http://127.0.0.1:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@iglesia.com', password: 'Admin123!' })
    });
    const loginData = await loginRes.json();
    console.log('Login status:', loginRes.status);
    console.log('Login success:', loginData.success);
    console.log('Token generated:', !!loginData.token);
    console.log('User displayName:', loginData.user?.displayName);
    console.log('User passwordHash should not be present:', !loginData.user?.passwordHash);

    const token = loginData.token;

    // Test Bootstrap
    console.log('\n--- Test 2: GET /api/bootstrap (with valid token) ---');
    const bootRes = await fetch(`http://127.0.0.1:${PORT}/api/bootstrap`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const bootData = await bootRes.json();
    console.log('Bootstrap status:', bootRes.status);
    console.log('Number of Users:', bootData.users?.length);
    console.log('Number of Groups:', bootData.groups?.length);
    console.log('Organization Name:', bootData.organizationName);
    console.log('Theme Color:', bootData.themeColor);

    // Test Register Pending User
    console.log('\n--- Test 3: POST /api/auth/register ---');
    const regRes = await fetch(`http://127.0.0.1:${PORT}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test_pending@iglesia.com',
        password: 'PendingPassword123!',
        displayName: 'Test Pending User',
        city: 'Medellin',
        country: 'Colombia'
      })
    });
    const regData = await regRes.json();
    console.log('Register status:', regRes.status);
    console.log('Register success:', regData.success);
    console.log('Register message:', regData.message);

    // Test Login with Pending User (should fail with 403)
    console.log('\n--- Test 4: POST /api/auth/login (pending user) ---');
    const loginPendingRes = await fetch(`http://127.0.0.1:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test_pending@iglesia.com', password: 'PendingPassword123!' })
    });
    const loginPendingData = await loginPendingRes.json();
    console.log('Login pending status (expected 403):', loginPendingRes.status);
    console.log('Login pending error message:', loginPendingData.error);

    // Test Admin Approve
    // Let's get the uid of the new user from database
    const pendingUser = db.prepare('SELECT uid FROM users WHERE email = ?').get('test_pending@iglesia.com');
    console.log('\n--- Test 5: POST /api/users/:uid/approve ---');
    const approveRes = await fetch(`http://127.0.0.1:${PORT}/api/users/${pendingUser.uid}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const approveData = await approveRes.json();
    console.log('Approve status:', approveRes.status);
    console.log('Approve success:', approveData.success);

    // Test Login with approved user (should now succeed)
    console.log('\n--- Test 6: POST /api/auth/login (after approval) ---');
    const loginApprovedRes = await fetch(`http://127.0.0.1:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test_pending@iglesia.com', password: 'PendingPassword123!' })
    });
    const loginApprovedData = await loginApprovedRes.json();
    console.log('Login approved status:', loginApprovedRes.status);
    console.log('Login approved success:', loginApprovedData.success);
    console.log('Login approved onboarding completed (expected false):', loginApprovedData.user?.onboardingCompleted);

    const pendingToken = loginApprovedData.token;

    // Test Onboarding
    console.log('\n--- Test 7: POST /api/auth/onboarding ---');
    const onboardRes = await fetch(`http://127.0.0.1:${PORT}/api/auth/onboarding`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pendingToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: '+57 321 000 0000',
        favoriteVerse: 'Juan 3:16',
        testimony: 'Mi testimonio de fe.',
        privacySettings: { showPhone: true, showEmail: false, showCity: true }
      })
    });
    const onboardData = await onboardRes.json();
    console.log('Onboarding status:', onboardRes.status);
    console.log('Onboarding success:', onboardData.success);
    console.log('Onboarding completed (expected true):', onboardData.user?.onboardingCompleted);
    console.log('Onboarding phone:', onboardData.user?.phone);

    // Test PUT /api/config
    console.log('\n--- Test 8: PUT /api/config ---');
    const configRes = await fetch(`http://127.0.0.1:${PORT}/api/config`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organizationName: 'Nueva Congregacion Digital',
        themeColor: '#FF0000'
      })
    });
    const configData = await configRes.json();
    console.log('Config status:', configRes.status);
    console.log('Config updated organizationName:', configData.organizationName);
    console.log('Config updated themeColor:', configData.themeColor);

  } catch (error) {
    console.error('Test verification failed:', error);
  } finally {
    server.close(() => {
      console.log('\nTest server shut down. Verification complete.');
      process.exit(0);
    });
  }
});
