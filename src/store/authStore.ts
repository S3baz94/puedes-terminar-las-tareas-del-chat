import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { demoCredentials } from '../constants/mockData';
import type { User, PrivacySettings } from '../types/models';
import { useAppStore } from './appStore';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  completeOnboarding: (details?: {
    phone: string;
    favoriteVerse: string;
    testimony: string;
    privacySettings: PrivacySettings;
  }) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      status: 'idle',
      error: null,
      async login(email, password) {
        set({ status: 'loading', error: null });
        await new Promise((resolve) => window.setTimeout(resolve, 380));

        const credential = demoCredentials.find(
          (item) =>
            item.email.toLowerCase() === email.trim().toLowerCase() &&
            item.password === password,
        );

        const users = useAppStore.getState().users;
        const user = credential
          ? users.find((candidate) => candidate.email === credential.email) ?? null
          : null;

        if (!user) {
          set({ status: 'error', error: 'Credenciales invalidas' });
          return false;
        }

        set({ user, status: 'authenticated', error: null });
        return true;
      },
      logout() {
        set({ user: null, status: 'idle', error: null });
      },
      completeOnboarding(details) {
        set((state) => {
          if (!state.user) return { user: null };
          
          const updatedUser: User = {
            ...state.user,
            ...details,
            onboardingCompleted: true,
          };
          
          // Sync to appStore
          useAppStore.getState().updateUserProfile(state.user.uid, {
            ...details,
            onboardingCompleted: true,
          });

          return { user: updatedUser };
        });
      },
    }),
    {
      name: 'congregacion-digital-auth',
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
