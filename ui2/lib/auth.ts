// Helper functions for authentication

/**
 * Get the authentication token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken")
  }
  return null
}

/**
 * Add the auth token to fetch headers
 */
export function addAuthHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getAuthToken()
  if (token) {
    return {
      ...headers,
      Authorization: `Bearer ${token}`,
    }
  }
  return headers
}

/**
 * Check if the user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken()
}

/**
 * Authenticated fetch function that automatically adds the auth token
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = addAuthHeader(options.headers || {})
  return fetch(url, {
    ...options,
    headers,
  })
}
