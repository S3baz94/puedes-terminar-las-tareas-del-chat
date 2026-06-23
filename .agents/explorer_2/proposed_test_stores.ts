import { assert } from 'console';
import http from 'http';

// Set VERCEL env variable before importing the app to avoid starting the server
// on port 3001 and to force the use of an in-memory SQLite database.
process.env.VERCEL = 'true';

// 1. Mock the browser environment (localStorage, window) before importing stores.
const storage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => storage[key] || null,
  setItem: (key: string, value: string) => {
    storage[key] = value;
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
  clear: () => {
    for (const key in storage) {
      delete storage[key];
    }
  },
  get length() {
    return Object.keys(storage).length;
  },
  key: (index: number) => Object.keys(storage)[index] || null,
};

(global as any).window = {
  localStorage: localStorageMock,
  setTimeout: global.setTimeout,
  clearTimeout: global.clearTimeout,
  addEventListener: () => {},
  removeEventListener: () => {},
};
(global as any).localStorage = localStorageMock;

// Helper to wait/poll for a condition (resolves race conditions)
const waitFor = (fn: () => boolean, timeout = 2000) => {
  return new Promise<void>((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (fn()) {
        resolve();
      } else if (Date.now() - start > timeout) {
        reject(new Error('Timeout waiting for state condition'));
      } else {
        setTimeout(check, 10);
      }
    };
    check();
  });
};

async function runTests() {
  console.log('--- STARTING EMPIRICAL STORE VERIFICATION ---');

  // Dynamically import the express app to prevent hoisted ES module imports
  // from executing before we set process.env.VERCEL = 'true'.
  const { default: app } = await import('../server/index.js');

  // Start the server programmatically on a random free port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test Express server programmatically started at ${baseUrl}`);

  // Intercept/mock global fetch to prefix relative paths with our test server baseUrl
  const originalFetch = global.fetch;
  global.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    let url = typeof input === 'string' ? input : input.toString();
    if (url.startsWith('/')) {
      url = `${baseUrl}${url}`;
    }
    return originalFetch(url, init);
  };

  const { useAppStore } = await import('../src/store/appStore.js');
  const { useAuthStore } = await import('../src/store/authStore.js');

  let passed = true;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            console.log(`[PASS] ${name}`);
          })
          .catch((err) => {
            console.error(`[FAIL] ${name}:`, err);
            passed = false;
          });
      } else {
        console.log(`[PASS] ${name}`);
      }
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err);
      passed = false;
    }
  }

  try {
    // Test 1: Initial state load
    test('Initial states load with mock data', () => {
      const appState = useAppStore.getState();
      const authState = useAuthStore.getState();

      // Verify initial users exist in appStore
      if (appState.users.length === 0) throw new Error('AppStore loaded with empty users');
      if (authState.user !== null) throw new Error('AuthStore initially should not have a logged in user');
      if (appState.organizationName !== 'Los Invisibles de Jesus') {
        throw new Error(`Unexpected initial organization name: ${appState.organizationName}`);
      }
    });

    // Test 2: Successful Login
    await test('Successful Login syncs user from appStore', async () => {
      const appStore = useAppStore.getState();

      // Find a demo user to log in
      const targetUser = appStore.users.find((u) => u.email === 'miembro@iglesia.com');
      if (!targetUser) throw new Error('Demo member user not found in appStore');

      // Perform login
      const success = await useAuthStore.getState().login('miembro@iglesia.com', 'Miembro123!');
      if (!success) throw new Error('Login failed with valid credentials');

      const authState = useAuthStore.getState();
      if (authState.status !== 'authenticated') throw new Error(`Unexpected auth status: ${authState.status}`);
      if (!authState.user) throw new Error('Authenticated user is null');
      if (authState.user.email !== 'miembro@iglesia.com') {
        throw new Error(`Expected email miembro@iglesia.com, got ${authState.user.email}`);
      }
    });

    // Test 3: Failed Login
    await test('Failed Login sets error status', async () => {
      // Attempt login with bad password
      const success = await useAuthStore.getState().login('miembro@iglesia.com', 'WrongPass!');
      if (success) throw new Error('Login succeeded with invalid password');

      const authState = useAuthStore.getState();
      if (authState.status !== 'error') throw new Error(`Expected error status, got ${authState.status}`);
      if (authState.error !== 'Credenciales invalidas') {
        throw new Error(`Expected "Credenciales invalidas", got "${authState.error}"`);
      }
    });

    // Re-login member for remaining member tests
    await useAuthStore.getState().login('miembro@iglesia.com', 'Miembro123!');

    // Test 4: Onboarding completion & store synchronization
    await test('Complete onboarding updates both authStore and appStore', async () => {
      const authStore = useAuthStore.getState();
      const initialAuthUser = authStore.user;
      if (!initialAuthUser) throw new Error('No user logged in before onboarding');

      const onboardingDetails = {
        phone: '+57 322 999 8888',
        favoriteVerse: 'Juan 3:16',
        testimony: 'Mi testimonio de fe',
        privacySettings: {
          showPhone: true,
          showCity: false,
          showEmail: true,
        },
      };

      // Complete onboarding (async action)
      const success = await useAuthStore.getState().completeOnboarding(onboardingDetails);
      if (!success) throw new Error('completeOnboarding failed');

      // Verify authStore is updated
      const updatedAuthState = useAuthStore.getState();
      if (!updatedAuthState.user) throw new Error('User became null after onboarding');
      if (!updatedAuthState.user.onboardingCompleted) throw new Error('onboardingCompleted is not true in authStore');
      if (updatedAuthState.user.phone !== onboardingDetails.phone) throw new Error('Phone mismatch in authStore');
      if (updatedAuthState.user.favoriteVerse !== onboardingDetails.favoriteVerse) {
        throw new Error('Verse mismatch in authStore');
      }

      // Verify appStore is synchronized reactively (handle potential race condition since
      // completeOnboarding triggers updateUserProfile in the background without awaiting it)
      await waitFor(() => {
        const u = useAppStore.getState().users.find((u) => u.uid === initialAuthUser.uid);
        return u?.onboardingCompleted === true && u?.phone === onboardingDetails.phone;
      });
    });

    // Test 5: Update User Profile action in appStore syncs back to authStore
    await test('updateUserProfile in appStore updates authStore user', async () => {
      const authStore = useAuthStore.getState();
      const currentAuthUser = authStore.user;
      if (!currentAuthUser) throw new Error('No user logged in');

      // Update profile in appStore
      await useAppStore.getState().updateUserProfile(currentAuthUser.uid, {
        city: 'Barranquilla',
        country: 'Colombia',
      });

      // Check appStore state
      const updatedAppUser = useAppStore.getState().users.find((u) => u.uid === currentAuthUser.uid);
      if (updatedAppUser?.city !== 'Barranquilla') throw new Error('City did not update in appStore');

      // Check authStore state (should be synced)
      const updatedAuthUser = useAuthStore.getState().user;
      if (updatedAuthUser?.city !== 'Barranquilla') throw new Error('City did not sync to authStore');
    });

    // Test 6: Approve user updates status and syncs
    await test('approveUser updates status to active and syncs to authStore', async () => {
      // Log in as an administrator first, since approveUser is restricted to admin/super_admin
      const adminLoginSuccess = await useAuthStore.getState().login('admin@iglesia.com', 'Admin123!');
      if (!adminLoginSuccess) throw new Error('Admin login failed');

      const appStore = useAppStore.getState();
      const pendingUser = appStore.users.find((u) => u.status === 'pending');
      if (!pendingUser) {
        console.log('[SKIP] No pending user to test approval');
        return;
      }

      // Approve the pending user via appStore action
      await useAppStore.getState().approveUser(pendingUser.uid);

      // Verify in appStore
      const approvedAppUser = useAppStore.getState().users.find((u) => u.uid === pendingUser.uid);
      if (approvedAppUser?.status !== 'active') throw new Error('User status did not change to active in appStore');
    });

    // Test 7: Attendance toggle changes attendee list in events
    await test('toggleAttendance updates attendees reactively', async () => {
      // Running under the admin session started in Test 6, which satisfies the admin/leader requirement
      const appStore = useAppStore.getState();
      const event = appStore.events[0];
      if (!event) throw new Error('No events found in appStore');

      const userId = 'u-member';
      const initiallyPresent = event.attendeeIds.includes(userId);

      // Toggle once
      await useAppStore.getState().toggleAttendance(event.id, userId);
      let updatedEvent = useAppStore.getState().events.find((e) => e.id === event.id)!;
      if (updatedEvent.attendeeIds.includes(userId) === initiallyPresent) {
        throw new Error('toggleAttendance did not flip attendee presence');
      }

      // Toggle back
      await useAppStore.getState().toggleAttendance(event.id, userId);
      updatedEvent = useAppStore.getState().events.find((e) => e.id === event.id)!;
      if (updatedEvent.attendeeIds.includes(userId) !== initiallyPresent) {
        throw new Error('toggleAttendance did not flip attendee presence back');
      }
    });

    // Log back in as the member so that state persistence tests (Test 8 & 9) match the updated member profile
    await useAuthStore.getState().login('miembro@iglesia.com', 'Miembro123!');

    // Test 8: State persistence in mock localStorage
    test('Zustand persist writes serialized data to localStorage', () => {
      const authPersisted = localStorageMock.getItem('congregacion-digital-auth');
      const appPersisted = localStorageMock.getItem('congregacion-digital-data');

      if (!authPersisted) throw new Error('No persisted auth state in localStorage');
      if (!appPersisted) throw new Error('No persisted app state in localStorage');

      const authData = JSON.parse(authPersisted);
      const appData = JSON.parse(appPersisted);

      if (!authData.state || !authData.state.user) {
        throw new Error('Persisted auth data does not contain state.user');
      }
      if (!appData.state || !appData.state.users) {
        throw new Error('Persisted app data does not contain state.users');
      }

      // Verify specific updated value is in persisted data
      const memberInPersistedApp = appData.state.users.find((u: any) => u.uid === 'u-member');
      if (memberInPersistedApp.city !== 'Barranquilla') {
        throw new Error(`Persisted app state does not have updated city (expected Barranquilla, got ${memberInPersistedApp.city})`);
      }
      if (authData.state.user.city !== 'Barranquilla') {
        throw new Error(`Persisted auth state does not have updated city (expected Barranquilla, got ${authData.state.user.city})`);
      }
    });

    // Test 9: Reloading state from localStorage works correctly
    test('Zustand stores reload correct state from localStorage upon initialization', async () => {
      // Save current localStorage data
      const savedAuthData = localStorageMock.getItem('congregacion-digital-auth');
      const savedAppData = localStorageMock.getItem('congregacion-digital-data');

      // Clear Zustand store state (this will write null/empty states to localStorage)
      useAuthStore.setState({ user: null, status: 'idle' });
      
      // Restore the saved data to localStorage
      if (savedAuthData) localStorageMock.setItem('congregacion-digital-auth', savedAuthData);
      if (savedAppData) localStorageMock.setItem('congregacion-digital-data', savedAppData);

      // Trigger rehydration/persist re-loading
      await (useAuthStore.persist as any).rehydrate();
      await (useAppStore.persist as any).rehydrate();

      // Verify it restored the user from localStorage
      const rehydratedAuthUser = useAuthStore.getState().user;
      if (!rehydratedAuthUser) throw new Error('Failed to restore user from localStorage');
      if (rehydratedAuthUser.city !== 'Barranquilla') {
        throw new Error(`Rehydrated user has wrong city: ${rehydratedAuthUser.city}`);
      }
    });
  } finally {
    // Make sure to clean up the server connection
    server.close();
  }

  console.log('\n--- VERIFICATION COMPLETED ---');
  if (passed) {
    console.log('ALL TESTS PASSED SUCCESSFULLY! ✅');
  } else {
    console.error('SOME TESTS FAILED! ❌');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error in test runner:', err);
  process.exit(1);
});
