import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      await register({ name, email, password });
      setSuccess("Account created. You can now log in.");
      setTimeout(() => {
        navigate("/login");
      }, 800);
    } catch (err) {
      const message =
        err?.message || "Unable to register. Please try again later.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-1 sm:px-0">
      <div className="w-full max-w-md rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur sm:p-8">
        <h2 className="mb-2 text-center text-2xl font-bold text-blue-900">
          Create account
        </h2>
        <p className="mb-6 text-center text-sm text-gray-600">
          Join AI Health to track and manage your wellbeing.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700">
            Full name (optional)
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jane Doe"
              className="mt-1 w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </label>

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

          <label className="block text-sm font-medium text-gray-700">
            Confirm password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm password"
              className="mt-1 w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </label>

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
          {success && (
            <p className="text-xs font-medium text-emerald-600">{success}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-700 p-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-600">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
