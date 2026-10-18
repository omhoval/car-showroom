import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

let accessToken = null;
let onAuthFailure = () => {};
export const setAccessToken = (t) => {
  accessToken = t;
};
export const setAuthFailureHandler = (fn) => {
  onAuthFailure = fn;
};

const api = axios.create({ baseURL, withCredentials: true });
const bare = axios.create({ baseURL, withCredentials: true });

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing = null;
export function refreshSession() {
  if (!refreshing) {
    refreshing = bare
      .post('/auth/refresh')
      .then((r) => {
        accessToken = r.data.data.accessToken;
        return r.data.data;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const code = error.response?.data?.errorCode;
    if (error.response?.status === 401 && ['TOKEN_EXPIRED', 'UNAUTHENTICATED'].includes(code) && !original._retried) {
      original._retried = true;
      try {
        await refreshSession();
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (e) {
        onAuthFailure();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
