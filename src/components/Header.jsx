import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <header className="bg-white/80 backdrop-blur shadow-sm">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex items-center justify-between py-4">
          <button
            type="button"
            onClick={() => handleNavClick("/")}
            className="flex items-center gap-2 text-left"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg font-semibold text-white shadow-sm">
              AI
            </span>
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-wide text-blue-900">
                AI Health Assistant
              </span>
              <span className="hidden text-xs text-gray-500 sm:block">
                Smart care, simple UI
              </span>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-4 text-sm font-medium text-gray-700 md:flex">
            {user && (
              <button
                type="button"
                onClick={() => handleNavClick("/dashboard")}
                className="rounded-full px-3 py-1.5 text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
              >
                Dashboard
              </button>
            )}
            {user ? (
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  handleNavClick("/");
                }}
                className="rounded-full border border-blue-500 px-3 py-1.5 text-blue-600 transition hover:bg-blue-500 hover:text-white"
              >
                Logout
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleNavClick("/login")}
                className="rounded-full border border-blue-500 px-3 py-1.5 text-blue-600 transition hover:bg-blue-500 hover:text-white"
              >
                Login
              </button>
            )}
          </nav>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 md:hidden"
            aria-label="Toggle navigation"
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile nav */}
        {isOpen && (
          <nav className="flex flex-col gap-1 pb-3 text-sm font-medium text-gray-700 md:hidden">
            {user && (
              <button
                type="button"
                onClick={() => handleNavClick("/dashboard")}
                className="w-full rounded-lg px-3 py-2 text-left hover:bg-blue-50 hover:text-blue-700"
              >
                Dashboard
              </button>
            )}
            {user ? (
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  handleNavClick("/");
                }}
                className="w-full rounded-lg border border-blue-500 px-3 py-2 text-left text-blue-600 hover:bg-blue-500 hover:text-white"
              >
                Logout
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleNavClick("/login")}
                className="w-full rounded-lg border border-blue-500 px-3 py-2 text-left text-blue-600 hover:bg-blue-500 hover:text-white"
              >
                Login
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
