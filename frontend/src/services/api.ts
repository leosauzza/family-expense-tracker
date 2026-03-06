const API_URL = import.meta.env.VITE_API_URL || '';

// Build the base URL
// If VITE_API_URL starts with 'http', use it as-is
// If it starts with '/', use as relative path (proxied by nginx in production)
// Otherwise default to relative path /api
function getBaseUrl(): string {
  if (API_URL.startsWith('http')) {
    return API_URL;
  }

  if (API_URL.startsWith('/')) {
    // Use relative path - nginx will proxy to backend
    return API_URL;
  }

  // Default: use relative path /api
  return '/api';
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage: string;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || `HTTP error! status: ${response.status}`;
    } catch {
      errorMessage = errorText || `HTTP error! status: ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return response.json();
}
