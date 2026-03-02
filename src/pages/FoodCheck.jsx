import { useEffect, useState } from "react";
import { api } from "../services/api";

const FoodCheck = () => {
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const items = await api.foodChecks.list({ limit: 5 });
        setHistory(items);
      } catch (err) {
        setError(err?.message || "Failed to load history.");
      }
    };
    loadHistory();
  }, []);

  const handleCheck = async (event) => {
    event.preventDefault();
    if (!expiry) return;

    const today = new Date();
    const expDate = new Date(expiry);

    if (Number.isNaN(expDate.getTime())) {
      setResult({
        status: "error",
        message: "Please enter a valid expiry date.",
      });
      return;
    }

    const diffMs = expDate.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

    let status;
    let message;

    if (days < 0) {
      status = "expired";
      message = `${name || "This item"} expired ${Math.abs(
        days
      )} day(s) ago. It is not safe to use.`;
    } else if (days === 0) {
      status = "warning";
      message = `${
        name || "This item"
      } expires today. Use with caution and check for changes in smell, color, or texture.`;
    } else if (days <= 3) {
      status = "warning";
      message = `${name || "This item"} will expire in ${days} day(s). Try to use it soon and store it correctly.`;
    } else {
      status = "ok";
      message = `${
        name || "This item"
      } is not close to expiry (about ${days} days left), assuming it has been stored properly.`;
    }

    setResult({ status, message });

    try {
      const savedItem = await api.foodChecks.create({
        name: name || "Unnamed item",
        expiry,
        status,
        message,
        days_until_expiry: days,
      });
      setHistory((prev) => [savedItem, ...prev].slice(0, 5));
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to save check.");
    }
  };

  const badgeClasses =
    result?.status === "expired"
      ? "bg-red-100 text-red-800"
      : result?.status === "warning"
      ? "bg-amber-100 text-amber-800"
      : result?.status === "ok"
      ? "bg-emerald-100 text-emerald-800"
      : "bg-gray-100 text-gray-700";

  return (
    <section className="flex flex-1 items-center justify-center">
      <div className="flex w-full max-w-3xl flex-col rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-xl text-white">
            📦
          </span>
          <h2 className="text-xl font-semibold text-amber-900 sm:text-2xl">
            Food and medicine expiry checker
          </h2>
        </div>

        <form
          onSubmit={handleCheck}
          className="mb-4 grid gap-3 text-sm text-gray-800 sm:grid-cols-[2fr,1fr,auto] sm:gap-4"
        >
          <label className="flex flex-col gap-1 sm:col-span-1">
            <span className="font-medium text-gray-700">Item name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Milk, tablets"
              className="rounded-lg border border-gray-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </label>

          <label className="flex flex-col gap-1 sm:col-span-1">
            <span className="font-medium text-gray-700">Expiry date</span>
            <input
              type="date"
              value={expiry}
              onChange={(event) => setExpiry(event.target.value)}
              className="rounded-lg border border-gray-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              required
            />
          </label>

          <button
            type="submit"
            className="mt-1 w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 sm:mt-6 sm:w-auto"
          >
            Check
          </button>
        </form>

        {result && (
          <div className={`rounded-xl p-4 text-sm ${badgeClasses}`}>
            {result.message}
          </div>
        )}

        {error && (
          <p className="mt-3 text-xs font-medium text-red-600">{error}</p>
        )}

        {history.length > 0 && (
          <div className="mt-4 rounded-xl bg-white/90 p-3 text-xs text-gray-700 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-amber-900">
              Recent checks
            </h3>
            <ul className="space-y-1">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="truncate sm:max-w-[70%]">
                    {item.name} - <span className="capitalize">{item.status}</span>
                  </span>
                  {item.expiry && (
                    <span className="text-[10px] text-gray-500">{item.expiry}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-3 text-xs text-gray-500">
          Always check the package for damage, unusual smell, or color changes.
          When in doubt, it is safer to discard the item.
        </p>
      </div>
    </section>
  );
};

export default FoodCheck;
