import axios from 'axios';

// When VITE_API_URL is unset we rely on the Vite proxy so requests to /api
// are forwarded to the backend running on :5000.
const baseURL = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Normalise the message the UI shows
    const message =
      err.response?.data?.message ||
      err.response?.data?.errors?.[0]?.message ||
      err.message ||
      'Request failed';
    return Promise.reject({ ...err, message });
  }
);

export default api;
