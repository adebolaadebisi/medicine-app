import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { isAdminEmail } from "../utils/admin";

const Login = ({ adminMode = false }) => {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      if (adminMode && isAdminEmail(user.email)) {
        navigate("/admin", { replace: true });
        return;
      }
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate, adminMode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const loggedInUser = await login(email, password);
      if (adminMode) {
        if (!isAdminEmail(loggedInUser.email)) {
          await logout();
          throw new Error("This account is not an admin account.");
        }
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err?.message || "Unable to login. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-1 sm:px-0">
      <div className="w-full max-w-md rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur sm:p-8">
        <h1 className="mb-2 text-center text-3xl font-bold text-blue-900">
          {adminMode ? "Admin login" : "Welcome back"}
        </h1>
        <p className="mb-6 text-center text-sm text-gray-600">
          {adminMode
            ? "Sign in with your admin account to open the admin dashboard."
            : "Sign in to access your health dashboard."}
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="mt-1 w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </label>

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-700 p-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : adminMode ? "Login as Admin" : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-600">
          {adminMode ? (
            <>
              Need user access?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                User login
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Sign up
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Login;
