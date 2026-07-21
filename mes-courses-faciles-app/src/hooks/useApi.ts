import { useState, useCallback } from 'react';
import { isAbortOrNetworkCancellationError } from '@/lib/network-resilience';

interface FetchOptions extends RequestInit {
  body?: any;
}

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async (url: string, options: FetchOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      const isJson = options.body && typeof options.body === 'object' && !(options.body instanceof FormData);

      const res = await fetch(url, {
        ...options,
        headers: {
          ...(isJson ? { 'Content-Type': 'application/json' } : {}),
          ...options.headers,
        },
        body: isJson ? JSON.stringify(options.body) : options.body,
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || data.message || `Erreur ${res.status}`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (err: any) {
      if (!isAbortOrNetworkCancellationError(err)) {
        const msg = err.message || 'Une erreur inconnue est survenue';
        setError(msg);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { request, loading, error, setError };
}
