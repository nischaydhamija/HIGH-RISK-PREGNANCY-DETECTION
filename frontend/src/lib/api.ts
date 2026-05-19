const normalizeBaseUrl = (value: string | undefined) => {
  const baseUrl = value?.trim();
  if (!baseUrl) {
    return "";
  }

  return baseUrl.replace(/\/$/, "");
};

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL);

export const getApiUrl = (path: string) => {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_URL is not configured.");
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export const readApiResponseMessage = (responseText: string, fallbackMessage: string) => {
  if (!responseText) {
    return fallbackMessage;
  }

  try {
    const data = JSON.parse(responseText) as { message?: string; error?: string } | null;
    return data?.message || data?.error || fallbackMessage;
  } catch {
    return responseText || fallbackMessage;
  }
};

export const parseApiJson = <T = unknown>(responseText: string): T | null => {
  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    return null;
  }
};
