import { Platform } from 'react-native';
import axios from 'axios';
import SecureStore from '../utils/secureStore';
import Constants from 'expo-constants';

let BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:5001/api';

if (Platform.OS === 'web') {
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      BASE_URL = 'https://gymzy-aggregator.onrender.com/api';
    }
  }
} else {
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || Constants.manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        BASE_URL = `http://${host}:5001/api`;
      }
    }
  }
}

console.log('Backend API Base URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request Interceptor: Attach Access Token ───────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Auto-Refresh Token on 401 ───────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        await SecureStore.setItemAsync('accessToken', data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        // Refresh failed - clear tokens and redirect to login
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        // The auth store will detect missing token and redirect
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth API ───────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (idToken) => api.post('/auth/google', { idToken }),
  sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone, otp) => api.post('/auth/verify-otp', { phone, otp }),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (formData) =>
    api.put('/auth/update-profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ── Gym API ────────────────────────────────────────────────────────────────
export const gymAPI = {
  getNearby: (params) => api.get('/gyms/nearby', { params }),
  getById: (id) => api.get(`/gyms/${id}`),
  getAvailability: (id) => api.get(`/gyms/${id}/availability`),
  getTrainers: (id) => api.get(`/gyms/${id}/trainers`),
  registerGym: (formData) =>
    api.post('/gyms/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyGyms: () => api.get('/gyms/my/gyms'),
  updateGym: (id, data) => api.put(`/gyms/${id}`, data),
};

// ── Booking API ────────────────────────────────────────────────────────────
export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  verifyPayment: (data) => api.post('/bookings/verify-payment', data),
  getMyBookings: (params) => api.get('/bookings/my', { params }),
  checkIn: (id, qrCodeData) => api.post(`/bookings/${id}/checkin`, { qrCodeData }),
  cancel: (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),
};

// ── Review API ────────────────────────────────────────────────────────────
export const reviewAPI = {
  getGymReviews: (gymId, params) => api.get(`/reviews/gym/${gymId}`, { params }),
  create: (data) => api.post('/reviews', data),
  reply: (id, comment) => api.put(`/reviews/${id}/reply`, { comment }),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// ── Trainer API ───────────────────────────────────────────────────────────
export const trainerAPI = {
  getById: (id) => api.get(`/trainers/${id}`),
  create: (formData) =>
    api.post('/trainers', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/trainers/${id}`, data),
  delete: (id) => api.delete(`/trainers/${id}`),
};

export default api;
