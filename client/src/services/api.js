import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000", // Removed the /api from here

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 30000,
});

// Response and error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      (error.code === "ECONNABORTED"
        ? "The API request timed out. Please try again."
        : "Unable to reach the OpsRecall API. Check that the backend is running and retry.");

    return Promise.reject(new Error(message));
  }
);

// Analyze incident
export const analyzeIncident = (
  rawErrorLog,
  useMemory = true,
  saveIncident = true
) =>
  api.post("/api/incident/analyze", {
    errorLog: rawErrorLog,
    useMemory,
    saveIncident,
  });

// Resolve incident
export const resolveIncident = (
  incidentId,
  engineerFeedback,
  rootCause
) =>
  api.post("/api/incident/resolve", {
    incidentId,
    engineerFeedback,
    rootCause,
  });

// Get all incidents
export const getIncidents = () =>
  api.get("/api/incident");

// Get single incident
export const getIncident = (id) =>
  api.get(`/api/incident/${encodeURIComponent(id)}`);

// Get Hindsight memories
export const getMemories = () =>
  api.get("/api/memory");

// Get dashboard statistics
export const getStats = () =>
  api.get("/api/stats");

// Backend health check
export const getHealth = () =>
  api.get("/api/health");