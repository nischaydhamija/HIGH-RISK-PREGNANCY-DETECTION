const normalizeBaseUrl = (value: string | undefined) => {
  const baseUrl = value?.trim();
  if (!baseUrl) {
    return "http://127.0.0.1:8000";
  }

  return baseUrl.replace(/\/$/, "");
};

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
