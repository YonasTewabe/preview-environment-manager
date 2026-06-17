import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: { "Content-Type": "application/json" },
});

// Add request interceptor to include Bearer token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const configurationService = {
  getJenkinsSettings: async () => {
    const response = await api.get("/configuration/jenkins", {
      params: { includeSecrets: true },
    });
    return response.data?.settings || [];
  },
  saveJenkinsSettings: async (settings) => {
    const response = await api.put("/configuration/jenkins", { settings });
    return response.data;
  },
  getGithubSettings: async () => {
    const response = await api.get("/configuration/github", {
      params: { includeSecrets: true },
    });
    return response.data?.settings || [];
  },
  saveGithubSettings: async (settings) => {
    const response = await api.put("/configuration/github", { settings });
    return response.data;
  },
  getSystemSettings: async () => {
    const response = await api.get("/configuration/system", {
      params: { includeSecrets: true },
    });
    return response.data?.settings || [];
  },
  saveSystemSettings: async (settings) => {
    const response = await api.put("/configuration/system", { settings });
    return response.data;
  },
};

export default configurationService;
