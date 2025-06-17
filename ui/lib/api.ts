// Base URL from environment variable with fallback
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1"

/**
 * Makes an API request with the configured base URL
 */
export async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  // Ensure endpoint starts with a slash if not already
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  const url = `${API_BASE_URL}${path}`

  // Set default headers if not provided
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  return fetch(url, {
    ...options,
    headers,
  })
}


/**
 * Makes a form data API request (multipart/form-data)
 */
export async function apiFormRequest(
  endpoint: string,
  formData: FormData,
  options: RequestInit = {},
): Promise<Response> {
  // Ensure endpoint starts with a slash if not already
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  const url = `${API_BASE_URL}${path}`

  // Don't set Content-Type header as the browser will set it with the boundary
  const { headers = {}, ...restOptions } = options

  return fetch(url, {
    method: "POST",
    body: formData,
    ...restOptions,
    headers,
  })
}

/**
 * Makes a URL-encoded form API request (application/x-www-form-urlencoded)
 */
export async function apiUrlEncodedRequest(
  endpoint: string,
  data: Record<string, string>,
  options: RequestInit = {},
): Promise<Response> {
  // Ensure endpoint starts with a slash if not already
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  const url = `${API_BASE_URL}${path}`

  // Create URL-encoded string from data object
  const urlEncodedData = new URLSearchParams(data).toString()

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...options.headers,
    },
    body: urlEncodedData,
    ...options,
  })
}

/**
 * Add auth token to request headers
 */
export function withAuth(options: RequestInit = {}): RequestInit {
  const token = localStorage.getItem("authToken")

  return {
    ...options,
    headers: {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : "",
    },
  }
}
