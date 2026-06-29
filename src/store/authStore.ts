import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, PrivacySettings } from '../types/models';


type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

type AuthCallback = () => Promise<void> | void;
type ProfileCallback = (uid: string, user: User) => Promise<void> | void;

let onLoginSuccessCallback: AuthCallback | null = null;
let onLogoutCallback: AuthCallback | null = null;
let onProfileUpdateCallback: ProfileCallback | null = null;

export const authStoreRegistry = {
  onLoginSuccess: (cb: AuthCallback) => { onLoginSuccessCallback = cb; },
  onLogout: (cb: AuthCallback) => { onLogoutCallback = cb; },
  onProfileUpdate: (cb: ProfileCallback) => { onProfileUpdateCallback = cb; },
};

interface AuthState {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  completeOnboarding: (details?: {
    phone: string;
    favoriteVerse: string;
    testimony: string;
    privacySettings: PrivacySettings;
  }) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      status: 'idle',
      error: null,
      async login(email, password) {
        set({ status: 'loading', error: null });
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            set({
              user: data.user,
              token: data.token,
              status: 'authenticated',
              error: null,
            });
            if (onLoginSuccessCallback) await onLoginSuccessCallback();
            return true;
          } else {
            set({ status: 'error', error: data.error || 'Credenciales invalidas' });
            return false;
          }
        } catch (err: any) {
          set({ status: 'error', error: err.message || 'Error de conexion' });
          return false;
        }
      },
      logout() {
        set({ user: null, token: null, status: 'idle', error: null });
        if (onLogoutCallback) onLogoutCallback();
      },
      async completeOnboarding(details) {
        const token = useAuthStore.getState().token;
        if (!token) return false;
        try {
          const res = await fetch('/api/auth/onboarding', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(details),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            set({ user: data.user });
            if (onProfileUpdateCallback) await onProfileUpdateCallback(data.user.uid, data.user);
            return true;
          }
          return false;
        } catch (err) {
          console.error(err);
          return false;
        }
      },
    }),
    {
      name: 'congregacion-digital-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);
