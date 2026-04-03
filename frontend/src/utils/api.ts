export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  } as HeadersInit;

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || json.error || 'API request failed');
  }

  return json;
};
