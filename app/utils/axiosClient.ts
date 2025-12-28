import { useUser } from "@/app/context/userContext";
import axios from "axios";


// Create a function to get an Axios instance
export const useApiClient = () => {
  const { session } = useUser();

  const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL, 
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
    },
  });

  // Optional: handle token expiration globally
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.warn("Unauthorized – maybe token expired");
        // Optionally: redirect to login or refresh token
      }
      return Promise.reject(error);
    }
  );

  return apiClient;
};
