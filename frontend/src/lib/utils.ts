
import { clsx, type ClassValue } from "clsx"
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type UseGetResult<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  mutate: () => void;
};

export async function authenticatedFetch(input: RequestInfo, init: RequestInit = {}, retry = true): Promise<Response> {
  const res = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.headers || {})
    },
  });

  const isExpired = res.headers.get("Www-Authenticate") === "expired_token";
  if (isExpired && retry) {
    console.warn("Access token expired, attempting to refresh...");
    let refreshRes: Response;
    refreshRes = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/auth/refresh`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      method: "POST"
    });

    if (refreshRes.status >= 400) {
      window.location.href = "/logout";
    }

    if (refreshRes.ok) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return authenticatedFetch(input, init, false);
    } else {
      throw new Error("Token refresh failed");
    }
  }
  return res;
}
export function useGetRaw<T = any>(url: string, options?: RequestInit): UseGetResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    authenticatedFetch(`${import.meta.env.VITE_BACKEND_URL || ''}${url}`, {
      ...options,
      method: "GET",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`GET ${url} failed`);
        if (!cancelled) {
          setData(res as unknown as T);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return {
    data,
    loading,
    error,
    mutate: () => { },
  };
}

export function useGet<T = any>(url: string, options?: RequestInit): UseGetResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchIndex, setRefetchIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    let newURL = url;
    if (!url.startsWith("http")) {
      newURL = `${import.meta.env.VITE_BACKEND_URL || ''}${url}`;
    }

    authenticatedFetch(newURL, {
      ...options,
      method: "GET",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`GET ${url} failed`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url, refetchIndex]);

  return {
    data,
    loading,
    error,
    mutate: () => setRefetchIndex((i) => i + 1),
  };
}

type UseRequestOptions = RequestInit & { body?: any };

type UsePostResult<T> = {
  trigger: (body?: any, extraOptions?: RequestInit) => Promise<T | null>;
  data: T | null;
  loading: boolean;
  error: Error | null;
};

function createMethodHook(method: string) {
  return function useRequest<T = any>(url: string, options: UseRequestOptions = {}): UsePostResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const trigger = async (body?: any, extraOptions: RequestInit = {}): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const res = await authenticatedFetch(`${import.meta.env.VITE_BACKEND_URL || ''}${url}`, {
          method,
          headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
            ...(extraOptions.headers || {}),
          },
          body: JSON.stringify(body ?? options.body),
          ...options,
          ...extraOptions,
        });

        if (!res.ok) throw new Error(`${method} ${url} failed`);
        const json: T = await res.json();
        setData(json);
        return json;
      } catch (err: any) {
        setError(err);
        return null;
      } finally {
        setLoading(false);
      }
    };

    return { trigger, data, loading, error };
  };
}


export const usePost = createMethodHook("POST");
export const usePut = createMethodHook("PUT");
export const usePatch = createMethodHook("PATCH");
export const useDelete = createMethodHook("DELETE");