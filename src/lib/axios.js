import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || error.message || "Something went wrong";

    // 🔥 Central toast handling
    if (status) {
      switch (status) {
        case 400:
          toast.error(message);
          break;

        case 401:
          toast.error("Unauthorized. Please log in again.");
          // optional: logout / redirect
          break;

        case 403:
          toast.error("You do not have permission to perform this action.");
          break;

        case 404:
          toast.error("Resource not found.");
          break;

        case 500:
          toast.error("Server error. Please try again later.");
          break;

        default:
          toast.error(message);
      }
    } else {
      toast.error("Network error. Check your connection.");
    }

    return Promise.reject(error);
  },
);

export default api;
