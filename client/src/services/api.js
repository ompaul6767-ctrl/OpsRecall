import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message
      || (error.code === "ECONNABORTED" ? "The API request timed out. Please try again." : "Unable to reach the OpsRecall API. Check that the backend is running and retry.");
    return Promise.reject(new Error(message));
  },
);

export const analyzeIncident = (rawErrorLog, useMemory) => api.post("/incident/analyze", { rawErrorLog, useMemory });
export const resolveIncident = (incidentId, engineerFeedback, rootCause) => api.post("/incident/resolve", { incidentId, engineerFeedback, rootCause });
export const getIncidents = () => api.get("/incident");
export const getIncident = (id) => api.get(`/incident/${encodeURIComponent(id)}`);
export const getMemories = () => api.get("/memory");
export const getStats = () => api.get("/stats");
export const getHealth = () => api.get("/health");
