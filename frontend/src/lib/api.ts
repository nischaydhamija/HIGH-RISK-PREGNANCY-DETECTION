const normalizeBaseUrl = (value: string | undefined) => {
  const baseUrl = value?.trim();
  if (!baseUrl) {
    return "https://high-risk-pregnancy-detection.onrender.com";
  }

  return baseUrl.replace(/\/$/, "");
};

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
