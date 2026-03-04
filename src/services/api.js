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
  } catch {
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
  appointments: {
    create: (data) =>
      apiRequest("/appointments", { method: "POST", body: data, requiresAuth: true }),
    list: (params) =>
      apiRequest("/appointments", { query: params, requiresAuth: true }),
    cancel: (id) =>
      apiRequest(`/appointments/${id}/cancel`, {
        method: "PATCH",
        requiresAuth: true,
      }),
    reschedule: (id, data) =>
      apiRequest(`/appointments/${id}/reschedule`, {
        method: "PATCH",
        body: data,
        requiresAuth: true,
      }),
    adminList: (params) =>
      apiRequest("/appointments/admin", { query: params, requiresAuth: true }),
    adminUpdate: (id, data) =>
      apiRequest(`/appointments/admin/${id}`, {
        method: "PATCH",
        body: data,
        requiresAuth: true,
      }),
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
  medicationReminders: {
    create: (data) =>
      apiRequest("/medication-reminders", {
        method: "POST",
        body: data,
        requiresAuth: true,
      }),
    list: (params) =>
      apiRequest("/medication-reminders", { query: params, requiresAuth: true }),
    update: (id, data) =>
      apiRequest(`/medication-reminders/${id}`, {
        method: "PATCH",
        body: data,
        requiresAuth: true,
      }),
    remove: (id) =>
      apiRequest(`/medication-reminders/${id}`, {
        method: "DELETE",
        requiresAuth: true,
      }),
    adherenceSummary: (params) =>
      apiRequest("/medication-reminders/adherence", {
        query: params,
        requiresAuth: true,
      }),
    adherenceTrend: (params) =>
      apiRequest("/medication-reminders/adherence/trend", {
        query: params,
        requiresAuth: true,
      }),
    markAdherence: (id, data) =>
      apiRequest(`/medication-reminders/${id}/adherence`, {
        method: "POST",
        body: data,
        requiresAuth: true,
      }),
  },
  vitals: {
    create: (data) => apiRequest("/vitals", { method: "POST", body: data, requiresAuth: true }),
    list: (params) => apiRequest("/vitals", { query: params, requiresAuth: true }),
    trends: (params) => apiRequest("/vitals/trends", { query: params, requiresAuth: true }),
    flags: (params) => apiRequest("/vitals/flags", { query: params, requiresAuth: true }),
  },
  timeline: {
    list: (params) => apiRequest("/timeline", { query: params, requiresAuth: true }),
  },
  notifications: {
    list: (params) => apiRequest("/notifications", { query: params, requiresAuth: true }),
    unreadCount: () => apiRequest("/notifications/unread-count", { requiresAuth: true }),
    markRead: (id) =>
      apiRequest(`/notifications/${id}/read`, { method: "PATCH", requiresAuth: true }),
    markAllRead: () =>
      apiRequest("/notifications/read-all", { method: "PATCH", requiresAuth: true }),
  },
  caregiver: {
    invite: (data) =>
      apiRequest("/caregiver-links/invite", {
        method: "POST",
        body: data,
        requiresAuth: true,
      }),
    mine: () => apiRequest("/caregiver-links/mine", { requiresAuth: true }),
    assigned: () => apiRequest("/caregiver-links/assigned", { requiresAuth: true }),
    accept: (id) =>
      apiRequest(`/caregiver-links/${id}/accept`, { method: "PATCH", requiresAuth: true }),
    revoke: (id) =>
      apiRequest(`/caregiver-links/${id}/revoke`, { method: "PATCH", requiresAuth: true }),
    patientOverview: (patientId) =>
      apiRequest(`/caregiver-links/patient/${patientId}/overview`, { requiresAuth: true }),
  },
  admin: {
    overview: () => apiRequest("/admin/overview", { requiresAuth: true }),
    resetUserPassword: (data) =>
      apiRequest("/admin/users/reset-password", {
        method: "POST",
        body: data,
        requiresAuth: true,
      }),
  },
};
