import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

// import { useAuthStore } from '@/store/authen';

// Function to get token from URL query parameter
const getTokenFromQueryParam = (): string | null => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ac');
  }
  return null;
};

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000', // Replace with your API base URL
  timeout: 10000, // Adjust as needed
  headers: {
    "Content-Type": "application/json", // Ensure all requests use JSON
  },
});

// Function for exponential backoff delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Add a request interceptor
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get token from query parameter 'ac'
    const token = getTokenFromQueryParam();
    console.log(token);
    
    if (token) {
      config.headers['x-temp-token'] = token;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

    // Retry the request if we receive a 401 status
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
    }

    // Handle 502 Bad Gateway with retry (max 3 attempts, exponential backoff)
    if (error.response?.status === 502) {
      const maxRetries = 3;
      let retryCount = originalRequest._retryCount || 0;

      if (retryCount < maxRetries) {
        retryCount++;
        originalRequest._retryCount = retryCount;
        console.log(`502 Bad Gateway - Retrying request (${retryCount}/${maxRetries})...`);
        
        await delay(2 ** retryCount * 100); // Exponential backoff delay
        return axiosInstance(originalRequest); // Retry request
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
