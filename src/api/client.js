import axios from 'axios';
import { getInFlight, setInFlight } from '../lib/apiCache';

const api = axios.create({
  // Dev: vite proxy → /api. Prod: set VITE_API_BASE_URL (e.g. https://backend.chootistoys.com/api)
  baseURL: (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, ''),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ccs_token') || sessionStorage.getItem('ccs_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A request that never got a response (server unreachable, DNS/timeout, offline)
// is a connection problem, not a normal API error - surface it globally so
// ConnectivityGate can show the "connection lost" screen instead of every
// page having to handle this case individually.
api.interceptors.response.use(
  (response) => {
    window.dispatchEvent(new Event('ccs:connection-restored'));
    return response;
  },
  (error) => {
    if (!error.response) {
      window.dispatchEvent(new Event('ccs:connection-lost'));
    } else {
      window.dispatchEvent(new Event('ccs:connection-restored'));
    }
    return Promise.reject(error);
  }
);

// Every GET is deduped against an identical in-flight GET (same url + params)
// so simultaneous mounts don't fire duplicate network calls. Nothing is kept
// once a request resolves, so every new visit/navigation always hits the
// server for live data.
function requestKey(url, config) {
  return `${url}?${JSON.stringify(config?.params || {})}`;
}

const rawGet = api.get.bind(api);

api.get = (url, config = {}) => {
  if (config.skipCache) {
    return rawGet(url, config);
  }
  const key = requestKey(url, config);
  const existing = getInFlight(key);
  if (existing) {
    return existing;
  }
  const promise = rawGet(url, config);
  setInFlight(key, promise);
  return promise;
};

export default api;
