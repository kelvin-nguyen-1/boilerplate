import axiosInstance from "./axiosInstance";
import { API_ENDPOINTS } from "./apiEndpoints";

interface ApiEndpoint {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";
}

interface ApiRequestOptions {
  data?: any;
  params?: Record<string, any>;
  urlParams?: Record<string, string | null>;
  headers?: Record<string, string>;
}

/**
 * A utility function to make API requests using pre-defined endpoints and configurations.
 * This function handles dynamic URL parameters, query parameters, request payloads, and custom headers.
 * 
 * @param endpointKey - The key representing the endpoint in `API_ENDPOINTS` object.
 * @param options - Optional configurations including data, query params, URL params, and headers.
 * 
 * @returns {Promise<any>} - Resolves with the API response data or throws a formatted error.
 */
export const apiRequest = async (
  endpointKey: keyof typeof API_ENDPOINTS,
  options: ApiRequestOptions = {}
) => {
  const endpoint: ApiEndpoint = API_ENDPOINTS[endpointKey];
  if (!endpoint) {
    throw new Error("Invalid API endpoint");
  }

  let { url } = endpoint;
  const { method } = endpoint;
  const { data, params, urlParams, headers } = options;

  // Replace URL parameters like /users/:id
  if (urlParams) {
    for (const [key, value] of Object.entries(urlParams)) {
      if (value !== null) {
        url = url.replace(`:${key}`, encodeURIComponent(value));
      }
    }
  }

  try {
    const response = await axiosInstance({
      url,
      method,
      data,
      params,
      headers,
    });

    if (response.status >= 200 && response.status < 300) {
      return response;
    }

    return null;
  } catch (error: any) {
    console.error('API request failed:', error);

    const errorMessage =
      error?.response?.data?.response?.detail?.message ||
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.response?.data?.detail ||
      (typeof error?.response?.data === "string" ? error.response.data : null) ||
      error?.message ||
      "An error occurred during the API request";

    const customError = new Error(errorMessage);
    if (error?.response) {
      (customError as any).response = error.response;
    }

    throw customError;
  }
};
