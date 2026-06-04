import { create } from 'zustand';
import SecureStore from '../utils/secureStore';
import { authAPI } from '../api';

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true, // true during initial auth check

  // ── Initialize: Load from secure store ────────────────────────────────
  initialize: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');

      if (accessToken) {
        const { data } = await authAPI.getMe();
        set({ user: data.user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await get().logout();
      set({ isLoading: false });
    }
  },

  // ── Login ──────────────────────────────────────────────────────────────
  login: async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true });
    return data.user;
  },

  // ── Register ───────────────────────────────────────────────────────────
  register: async (userData) => {
    const { data } = await authAPI.register(userData);
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true });
    return data.user;
  },

  // ── Google Auth ────────────────────────────────────────────────────────
  googleLogin: async (idToken) => {
    const { data } = await authAPI.googleAuth(idToken);
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true });
    return data.user;
  },

  // ── Phone OTP ──────────────────────────────────────────────────────────
  verifyOTP: async (phone, otp) => {
    const { data } = await authAPI.verifyOTP(phone, otp);
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true });
    return data.user;
  },

  // ── Update User ────────────────────────────────────────────────────────
  updateUser: (userData) => set({ user: { ...get().user, ...userData } }),

  // ── Logout ─────────────────────────────────────────────────────────────
  logout: async () => {
    try {
      await authAPI.logout();
    } catch {}
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
