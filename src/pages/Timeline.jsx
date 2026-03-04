import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const eventConfig = {
  food_check: {
    label: "Food Check",
    badge: "bg-amber-100 text-amber-800",
  },
  meal_plan: {
    label: "Meal Plan",
    badge: "bg-emerald-100 text-emerald-800",
  },
  medication_reminder: {
    label: "Med Reminder",
    badge: "bg-blue-100 text-blue-800",
  },
  medication_adherence: {
    label: "Adherence",
    badge: "bg-purple-100 text-purple-800",
  },
  appointment: {
    label: "Appointment",
    badge: "bg-cyan-100 text-cyan-800",
  },
  vital_entry: {
    label: "Vitals",
    badge: "bg-rose-100 text-rose-800",
  },
};

const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const Timeline = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.timeline.list({ limit: 80 });
        setItems(response);
      } catch (err) {
        setError(err?.message || "Unable to load timeline.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const key = new Date(item.occurred_at).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries());
  }, [items]);

  return (
    <section className="mx-auto w-full max-w-5xl">
      <div className="mb-4 rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm sm:p-6">
        <h2 className="text-2xl font-bold text-blue-900">Health Timeline</h2>
        <p className="mt-1 text-sm text-gray-600">
          Your health actions and outcomes in one chronological view.
        </p>
      </div>

      {loading && <p className="text-sm text-gray-600">Loading timeline...</p>}
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          No timeline activity yet. Start by using diagnosis, food checks, meal plans, or reminders.
        </div>
      )}

      <div className="space-y-6">
        {grouped.map(([day, dayItems]) => (
          <div key={day}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {new Date(day).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </h3>
            <div className="space-y-2">
              {dayItems.map((item) => {
                const config = eventConfig[item.event_type] || {
                  label: item.event_type,
                  badge: "bg-gray-100 text-gray-800",
                };
                return (
                  <article
                    key={item.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${config.badge}`}
                      >
                        {config.label}
                      </span>
                    </div>
                    {item.description && <p className="text-sm text-gray-700">{item.description}</p>}
                    <p className="mt-1 text-xs text-gray-500">{formatDateTime(item.occurred_at)}</p>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Timeline;
