import axios from 'axios';

const TOKEN_KEY = 'pt_token';
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Expired/invalid token: clear session and return to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthCall = err.config?.url?.startsWith('/auth/login') || err.config?.url?.startsWith('/auth/register');
    if (err.response?.status === 401 && !isAuthCall) {
      tokenStore.clear();
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong';

const crud = (base) => ({
  list: (params) => api.get(base, { params }).then((r) => r.data),
  create: (data) => api.post(base, data).then((r) => r.data),
  update: (id, data) => api.put(`${base}/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`${base}/${id}`).then((r) => r.data),
});

export const authAPI = {
  register: (d) => api.post('/auth/register', d).then((r) => r.data),
  login: (d) => api.post('/auth/login', d).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};
export const userAPI = {
  updateProfile: (d) => api.put('/users/profile', d).then((r) => r.data),
  changePassword: (d) => api.put('/users/password', d).then((r) => r.data),
};
export const groupAPI = crud('/groups');
export const subjectAPI = crud('/subjects');
export const noteAPI = crud('/notes');
export const reportAPI = {
  ...crud('/reports'),
  analytics: () => api.get('/reports/analytics').then((r) => r.data),
};

export default api;
