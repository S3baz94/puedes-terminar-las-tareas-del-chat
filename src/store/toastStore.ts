import { create } from 'zustand';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastState {
  messages: ToastMessage[];
  notify: (message: Omit<ToastMessage, 'id'>) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  messages: [],
  notify(message) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set((state) => ({ messages: [...state.messages, { ...message, id }].slice(-4) }));
    window.setTimeout(() => {
      set((state) => ({ messages: state.messages.filter((item) => item.id !== id) }));
    }, 4200);
  },
  dismiss(id) {
    set((state) => ({ messages: state.messages.filter((item) => item.id !== id) }));
  },
}));
