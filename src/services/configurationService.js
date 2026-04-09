import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: { "Content-Type": "application/json" },
});

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
};

export default configurationService;
