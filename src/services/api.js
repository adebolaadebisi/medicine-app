const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const AUTH_TOKEN_KEY = "auth_token";

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const setAuthToken = (token) => {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

const buildHeaders = (extraHeaders = {}, requiresAuth = false) => {
  const headers = { "Content-Type": "application/json", ...extraHeaders };
  if (requiresAuth) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const toQueryString = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

export const apiRequest = async (
  path,
  { method = "GET", body, headers, requiresAuth = false, query } = {}
) => {
  const response = await fetch(`${API_BASE_URL}${path}${toQueryString(query)}`, {
    method,
    headers: buildHeaders(headers, requiresAuth),
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.detail || "Request failed";
    throw new Error(message);
  }

  return payload;
};

export const api = {
  auth: {
    register: (data) => apiRequest("/auth/register", { method: "POST", body: data }),
    login: (data) => apiRequest("/auth/login", { method: "POST", body: data }),
    me: () => apiRequest("/auth/me", { requiresAuth: true }),
  },
  doctors: {
    list: (params) => apiRequest("/doctors", { query: params }),
  },
  foodChecks: {
    create: (data) =>
      apiRequest("/food-checks", { method: "POST", body: data, requiresAuth: true }),
    list: (params) =>
      apiRequest("/food-checks", { query: params, requiresAuth: true }),
  },
  mealPlans: {
    create: (data) =>
      apiRequest("/meal-plans", { method: "POST", body: data, requiresAuth: true }),
    list: (params) =>
      apiRequest("/meal-plans", { query: params, requiresAuth: true }),
  },
};
