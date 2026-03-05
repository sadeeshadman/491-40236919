const backendOrigin = (
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000'
).replace(/\/$/, '');

function normalizeApiPath(path: string): string {
  if (path.startsWith('/api/')) return path;
  if (path === '/api') return path;
  return `/api/${path.replace(/^\/+/, '')}`;
}

export function getApiUrl(path: string): string {
  const normalizedPath = normalizeApiPath(path);

  if (typeof window !== 'undefined') {
    return normalizedPath;
  }

  return `${backendOrigin}${normalizedPath}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(getApiUrl(path), init);

  if (!response.ok) {
    let errorMessage = `API request failed: ${response.status}`;

    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) {
        errorMessage = body.error;
      }
    } catch {}

    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}
