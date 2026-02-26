import { create } from 'zustand';

interface PendingToast {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastStore {
  pendingToast: PendingToast | null;
  setPendingToast: (toast: PendingToast | null) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  pendingToast: null,
  setPendingToast: (toast) => set({ pendingToast: toast }),
}));
