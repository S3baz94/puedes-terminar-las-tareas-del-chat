// Mock the global fetch function BEFORE importing any store
global.fetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
  const urlStr = typeof url === 'string' ? url : url.toString();

  if (urlStr.includes('/api/auth/login')) {
    const { email, password } = JSON.parse(init?.body as string || '{}');
    if (email === 'miembro@iglesia.com' && password === 'Miembro123!') {
      return new Response(JSON.stringify({
        success: true,
        user: {
          uid: 'u-member',
          email: 'miembro@iglesia.com',
          displayName: 'Miembro Demo',
          role: 'member',
          status: 'active',
          onboardingCompleted: false,
          privacySettings: { showPhone: false, showEmail: true, showCity: true },
          city: 'Bogota',
          country: 'Colombia',
          phone: '+57 300 123 4567'
        },
        token: 'mock-jwt-token'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Credenciales invalidas'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
  }

  if (urlStr.includes('/api/bootstrap')) {
    const { useAppStore } = await import('../src/store/appStore.js');
    const appState = useAppStore.getState();
    return new Response(JSON.stringify({
      success: true,
      users: appState.users,
      groups: appState.groups,
      content: appState.content,
      prayerRequests: appState.prayerRequests,
      events: appState.events,
      pastoralNotes: appState.pastoralNotes,
      donations: appState.donations,
      messages: appState.messages,
      liveStream: appState.liveStream,
      notifications: appState.notifications
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (urlStr.includes('/api/auth/onboarding')) {
    const { useAuthStore } = await import('../src/store/authStore.js');
    const details = JSON.parse(init?.body as string || '{}');
    const currentUser = useAuthStore.getState().user || {};
    return new Response(JSON.stringify({
      success: true,
      user: {
        ...currentUser,
        ...details,
        onboardingCompleted: true
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (urlStr.includes('/api/users/') && urlStr.endsWith('/approve')) {
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (urlStr.includes('/api/users/')) {
    const { useAppStore } = await import('../src/store/appStore.js');
    const updates = JSON.parse(init?.body as string || '{}');
    const parts = urlStr.split('/');
    const userId = parts[parts.length - 1];
    const appState = useAppStore.getState();
    const user = appState.users.find(u => u.uid === userId) || {};
    return new Response(JSON.stringify({
      success: true,
      user: {
        ...user,
        ...updates
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (urlStr.includes('/api/events/') && urlStr.endsWith('/attendance')) {
    const { useAppStore } = await import('../src/store/appStore.js');
    const { userId } = JSON.parse(init?.body as string || '{}');
    const parts = urlStr.split('/');
    const eventId = parts[parts.length - 2];
    const appState = useAppStore.getState();
    const event = appState.events.find(e => e.id === eventId);
    if (event) {
      const attendeeIds = event.attendeeIds.includes(userId)
        ? event.attendeeIds.filter(id => id !== userId)
        : [...event.attendeeIds, userId];
      return new Response(JSON.stringify({
        success: true,
        event: {
          ...event,
          attendeeIds
        }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  }

  return new Response(JSON.stringify({ success: false, error: 'Not found' }), { status: 404 });
};

// Now import and execute the original test runner
import './test_stores';
