import { createContext, useContext, useEffect, useState } from "react";
import { api, clearAuthToken, getAuthToken, setAuthToken } from "../services/api";

const AuthContext = createContext(null);
const AUTH_USER_KEY = "auth_user";

const normalizeEmail = (email) => email.trim().toLowerCase();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = getAuthToken();
      if (!token) {
        localStorage.removeItem(AUTH_USER_KEY);
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const me = await api.auth.me();
        const nextUser = {
          id: me.id,
          email: me.email,
          name: me.full_name || me.email,
          isAdmin: !!me.is_admin,
          isCaregiver: !!me.is_caregiver,
        };
        setUser(nextUser);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
      } catch {
        clearAuthToken();
        localStorage.removeItem(AUTH_USER_KEY);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(AUTH_USER_KEY);
      }
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      throw new Error("Email and password are required.");
    }

    const response = await api.auth.login({
      email: normalizedEmail,
      password,
    });
    setAuthToken(response.access_token);

    const nextUser = {
      id: response.user.id,
      email: response.user.email,
      name: response.user.full_name || response.user.email,
      isAdmin: !!response.user.is_admin,
      isCaregiver: !!response.user.is_caregiver,
    };

    setUser(nextUser);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
    return nextUser;
  };

  const register = async ({ name, email, password, accountType = "patient" }) => {
    const normalizedEmail = normalizeEmail(email);
    const trimmedName = name?.trim() || "";

    if (!normalizedEmail || !password) {
      throw new Error("Email and password are required.");
    }

    await api.auth.register({
      email: normalizedEmail,
      password,
      full_name: trimmedName || null,
      account_type: accountType,
    });
  };

  const logout = async () => {
    clearAuthToken();
    localStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
