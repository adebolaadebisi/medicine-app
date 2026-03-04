import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const defaultForm = {
  measured_at: "",
  systolic_bp: "",
  diastolic_bp: "",
  glucose_mg_dl: "",
  weight_kg: "",
  heart_rate_bpm: "",
  note: "",
};

const formatDate = (value) => new Date(value).toLocaleString();

const toNumberOrNull = (value) => (value === "" ? null : Number(value));
const emergencyNumberRaw = import.meta.env.VITE_EMERGENCY_NUMBER || "911";
const emergencyNumberDigits = emergencyNumberRaw.replace(/[^\d+]/g, "");
const emergencyCallHref = `tel:${emergencyNumberDigits || "911"}`;

const latestValue = (items, key) => {
  const found = items.find((item) => item[key] !== null && item[key] !== undefined);
  return found ? found[key] : null;
};

const Vitals = () => {
  const [form, setForm] = useState(defaultForm);
  const [entries, setEntries] = useState([]);
  const [trends, setTrends] = useState(null);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [entryRows, trendData, flagRows] = await Promise.all([
        api.vitals.list({ limit: 50 }),
        api.vitals.trends({ days: 30 }),
        api.vitals.flags({ days: 30, limit: 20 }),
      ]);
      setEntries(entryRows);
      setTrends(trendData);
      setFlags(flagRows);
    } catch (err) {
      setError(err?.message || "Unable to load vitals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    return {
      bp:
        latestValue(entries, "systolic_bp") && latestValue(entries, "diastolic_bp")
          ? `${latestValue(entries, "systolic_bp")}/${latestValue(entries, "diastolic_bp")}`
          : "--",
      glucose: latestValue(entries, "glucose_mg_dl") ?? "--",
      weight: latestValue(entries, "weight_kg") ?? "--",
      heartRate: latestValue(entries, "heart_rate_bpm") ?? "--",
    };
  }, [entries]);

  const emergencyFlags = useMemo(() => flags.filter((flag) => flag.emergency), [flags]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await api.vitals.create({
        measured_at: form.measured_at ? new Date(form.measured_at).toISOString() : null,
        systolic_bp: toNumberOrNull(form.systolic_bp),
        diastolic_bp: toNumberOrNull(form.diastolic_bp),
        glucose_mg_dl: toNumberOrNull(form.glucose_mg_dl),
        weight_kg: toNumberOrNull(form.weight_kg),
        heart_rate_bpm: toNumberOrNull(form.heart_rate_bpm),
        note: form.note.trim() || null,
      });
      setSuccess("Vital entry saved.");
      setForm(defaultForm);
      await load();
    } catch (err) {
      setError(err?.message || "Unable to save vitals.");
    } finally {
      setSubmitting(false);
    }
  };

  const metricSeries = [
    { key: "blood_pressure_systolic", label: "Systolic BP", unit: "mmHg", color: "text-blue-800" },
    { key: "blood_pressure_diastolic", label: "Diastolic BP", unit: "mmHg", color: "text-indigo-800" },
    { key: "glucose", label: "Glucose", unit: "mg/dL", color: "text-amber-800" },
    { key: "weight", label: "Weight", unit: "kg", color: "text-emerald-800" },
    { key: "heart_rate", label: "Heart Rate", unit: "bpm", color: "text-rose-800" },
  ];

  const handleCopyEmergencyNumber = async () => {
    setCopyMessage("");
    try {
      await navigator.clipboard.writeText(emergencyNumberRaw);
      setCopyMessage("Emergency number copied.");
    } catch {
      setCopyMessage("Unable to copy automatically. Please copy it manually.");
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="mb-4 rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm sm:p-6">
        <h2 className="text-2xl font-bold text-blue-900">Vitals Tracker</h2>
        <p className="mt-1 text-sm text-gray-600">
          Log key health vitals and monitor risk flags over time.
        </p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs uppercase text-blue-700">Latest BP</p>
          <p className="text-2xl font-bold text-blue-900">{summary.bp}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs uppercase text-amber-700">Latest Glucose</p>
          <p className="text-2xl font-bold text-amber-900">{summary.glucose}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs uppercase text-emerald-700">Latest Weight</p>
          <p className="text-2xl font-bold text-emerald-900">{summary.weight}</p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
          <p className="text-xs uppercase text-rose-700">Latest Heart Rate</p>
          <p className="text-2xl font-bold text-rose-900">{summary.heartRate}</p>
        </div>
      </div>

      {emergencyFlags.length > 0 && (
        <div className="mb-4 rounded-2xl border border-red-300 bg-red-50 p-4 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-red-800">
            Emergency Warning
          </h3>
          <p className="mt-1 text-sm text-red-700">
            One or more recent vital readings indicate possible emergency risk. Seek urgent medical
            attention.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-800">
            {emergencyFlags.slice(0, 3).map((flag, idx) => (
              <li key={`${flag.metric}-${flag.measured_at}-${idx}`}>{flag.message}</li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={emergencyCallHref}
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              Call Emergency ({emergencyNumberRaw})
            </a>
            <button
              type="button"
              onClick={handleCopyEmergencyNumber}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100"
            >
              Copy Number
            </button>
            {copyMessage && <p className="text-xs font-medium text-red-700">{copyMessage}</p>}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <form
          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          onSubmit={handleSubmit}
        >
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Log Vitals</h3>
          <label className="mb-2 block text-xs font-medium text-gray-700">
            Measured at (optional)
            <input
              type="datetime-local"
              value={form.measured_at}
              onChange={(event) => setForm((prev) => ({ ...prev, measured_at: event.target.value }))}
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>

          <div className="mb-2 grid grid-cols-2 gap-2">
            <label className="block text-xs font-medium text-gray-700">
              Systolic
              <input
                type="number"
                value={form.systolic_bp}
                onChange={(event) => setForm((prev) => ({ ...prev, systolic_bp: event.target.value }))}
                className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-gray-700">
              Diastolic
              <input
                type="number"
                value={form.diastolic_bp}
                onChange={(event) => setForm((prev) => ({ ...prev, diastolic_bp: event.target.value }))}
                className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </label>
          </div>

          <label className="mb-2 block text-xs font-medium text-gray-700">
            Glucose (mg/dL)
            <input
              type="number"
              value={form.glucose_mg_dl}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, glucose_mg_dl: event.target.value }))
              }
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="mb-2 block text-xs font-medium text-gray-700">
            Weight (kg)
            <input
              type="number"
              step="0.1"
              value={form.weight_kg}
              onChange={(event) => setForm((prev) => ({ ...prev, weight_kg: event.target.value }))}
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="mb-2 block text-xs font-medium text-gray-700">
            Heart rate (bpm)
            <input
              type="number"
              value={form.heart_rate_bpm}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, heart_rate_bpm: event.target.value }))
              }
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="mb-2 block text-xs font-medium text-gray-700">
            Note (optional)
            <textarea
              value={form.note}
              onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
              className="mt-1 min-h-20 w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save Vitals"}
          </button>
          {success && <p className="mt-2 text-xs font-medium text-emerald-700">{success}</p>}
          {error && <p className="mt-2 text-xs font-medium text-red-700">{error}</p>}
        </form>

        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Risk Flags (Last 30 days)</h3>
            {loading && <p className="text-sm text-gray-600">Loading flags...</p>}
            {!loading && flags.length === 0 && (
              <p className="text-sm text-gray-600">No risk flags detected recently.</p>
            )}
            <ul className="space-y-2">
              {flags.slice(0, 6).map((flag, idx) => (
                <li
                  key={`${flag.metric}-${flag.measured_at}-${idx}`}
                  className={`rounded p-2 text-xs ${
                    flag.emergency ? "bg-red-50" : "bg-amber-50"
                  }`}
                >
                  <p className={`font-semibold ${flag.emergency ? "text-red-800" : "text-amber-800"}`}>
                    {flag.metric} ({flag.level})
                  </p>
                  <p className={flag.emergency ? "text-red-900" : "text-amber-900"}>{flag.message}</p>
                  <p className={`text-[11px] ${flag.emergency ? "text-red-700" : "text-amber-700"}`}>
                    {formatDate(flag.measured_at)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">30-Day Trend Snapshot</h3>
            {loading && <p className="text-sm text-gray-600">Loading trends...</p>}
            {!loading && trends && (
              <div className="grid gap-2 sm:grid-cols-2">
                {metricSeries.map((metric) => {
                  const points = trends[metric.key] || [];
                  const last = points.length ? points[points.length - 1].value : null;
                  return (
                    <div key={metric.key} className="rounded border border-gray-100 bg-gray-50 p-2">
                      <p className="text-xs text-gray-600">{metric.label}</p>
                      <p className={`text-lg font-bold ${metric.color}`}>
                        {last !== null ? `${last} ${metric.unit}` : "--"}
                      </p>
                      <p className="text-[11px] text-gray-500">{points.length} data points</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Recent Entries</h3>
            {loading && <p className="text-sm text-gray-600">Loading entries...</p>}
            {!loading && entries.length === 0 && (
              <p className="text-sm text-gray-600">No vitals logged yet.</p>
            )}
            <div className="space-y-2">
              {entries.slice(0, 10).map((item) => (
                <div key={item.id} className="rounded border border-gray-100 bg-gray-50 p-2 text-xs">
                  <p className="font-medium text-gray-900">{formatDate(item.measured_at)}</p>
                  <p className="text-gray-700">
                    BP:{" "}
                    {item.systolic_bp && item.diastolic_bp
                      ? `${item.systolic_bp}/${item.diastolic_bp}`
                      : "--"}{" "}
                    | Glucose: {item.glucose_mg_dl ?? "--"} | Weight: {item.weight_kg ?? "--"} | HR:{" "}
                    {item.heart_rate_bpm ?? "--"}
                  </p>
                  {item.note && <p className="text-gray-600">{item.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Vitals;
