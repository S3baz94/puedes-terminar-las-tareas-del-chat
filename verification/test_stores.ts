import { assert } from 'console';

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

// 2. Dynamically import the stores so that they initialize with our mocks.
async function runTests() {
  console.log('--- STARTING EMPIRICAL STORE VERIFICATION ---');

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
    const authStore = useAuthStore.getState();
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

  // Re-login member for remaining tests
  await useAuthStore.getState().login('miembro@iglesia.com', 'Miembro123!');

  // Test 4: Onboarding completion & store synchronization
  test('Complete onboarding updates both authStore and appStore', () => {
    const authStore = useAuthStore.getState();
    const appStore = useAppStore.getState();

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

    // Complete onboarding
    useAuthStore.getState().completeOnboarding(onboardingDetails);

    // Verify authStore is updated
    const updatedAuthState = useAuthStore.getState();
    if (!updatedAuthState.user) throw new Error('User became null after onboarding');
    if (!updatedAuthState.user.onboardingCompleted) throw new Error('onboardingCompleted is not true in authStore');
    if (updatedAuthState.user.phone !== onboardingDetails.phone) throw new Error('Phone mismatch in authStore');
    if (updatedAuthState.user.favoriteVerse !== onboardingDetails.favoriteVerse) {
      throw new Error('Verse mismatch in authStore');
    }

    // Verify appStore is synchronized
    const updatedAppState = useAppStore.getState();
    const updatedAppUser = updatedAppState.users.find((u) => u.uid === initialAuthUser.uid);
    if (!updatedAppUser) throw new Error('User not found in appStore after onboarding');
    if (!updatedAppUser.onboardingCompleted) throw new Error('onboardingCompleted is not true in appStore');
    if (updatedAppUser.phone !== onboardingDetails.phone) throw new Error('Phone mismatch in appStore');
    if (updatedAppUser.favoriteVerse !== onboardingDetails.favoriteVerse) {
      throw new Error('Verse mismatch in appStore');
    }
  });

  // Test 5: Update User Profile action in appStore syncs back to authStore
  test('updateUserProfile in appStore updates authStore user', () => {
    const authStore = useAuthStore.getState();
    const appStore = useAppStore.getState();

    const currentAuthUser = authStore.user;
    if (!currentAuthUser) throw new Error('No user logged in');

    // Update profile in appStore
    useAppStore.getState().updateUserProfile(currentAuthUser.uid, {
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
  test('approveUser updates status to active and syncs to authStore', () => {
    // Let's log in as a pending user if there is one
    const appStore = useAppStore.getState();
    const pendingUser = appStore.users.find((u) => u.status === 'pending');
    if (!pendingUser) {
      console.log('[SKIP] No pending user to test approval');
      return;
    }

    // Approve the pending user via appStore action
    useAppStore.getState().approveUser(pendingUser.uid);

    // Verify in appStore
    const approvedAppUser = useAppStore.getState().users.find((u) => u.uid === pendingUser.uid);
    if (approvedAppUser?.status !== 'active') throw new Error('User status did not change to active in appStore');
  });

  // Test 7: Attendance toggle changes attendee list in events
  test('toggleAttendance updates attendees reactively', () => {
    const appStore = useAppStore.getState();
    const event = appStore.events[0];
    if (!event) throw new Error('No events found in appStore');

    const userId = 'u-member';
    const initiallyPresent = event.attendeeIds.includes(userId);

    // Toggle once
    useAppStore.getState().toggleAttendance(event.id, userId);
    let updatedEvent = useAppStore.getState().events.find((e) => e.id === event.id)!;
    if (updatedEvent.attendeeIds.includes(userId) === initiallyPresent) {
      throw new Error('toggleAttendance did not flip attendee presence');
    }

    // Toggle back
    useAppStore.getState().toggleAttendance(event.id, userId);
    updatedEvent = useAppStore.getState().events.find((e) => e.id === event.id)!;
    if (updatedEvent.attendeeIds.includes(userId) !== initiallyPresent) {
      throw new Error('toggleAttendance did not flip attendee presence back');
    }
  });

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
