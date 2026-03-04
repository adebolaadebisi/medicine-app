import { useEffect, useState } from "react";
import { api } from "../services/api";

const formatTime = (value) =>
  new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const kindStyles = {
  appointment_status: "bg-blue-100 text-blue-800",
  upcoming_appointment: "bg-cyan-100 text-cyan-800",
  missed_reminder: "bg-amber-100 text-amber-800",
  vital_flag: "bg-rose-100 text-rose-800",
  emergency_alert: "bg-red-100 text-red-800",
  caregiver_emergency_alert: "bg-red-100 text-red-800",
  caregiver_missed_reminder: "bg-orange-100 text-orange-800",
  caregiver_invite: "bg-emerald-100 text-emerald-800",
  caregiver_link_accepted: "bg-emerald-100 text-emerald-800",
  admin_caregiver_link_accepted: "bg-blue-100 text-blue-800",
};

const Notifications = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.notifications.list({ limit: 100 });
      setItems(response);
    } catch (err) {
      setError(err?.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const emitUpdate = () => {
    window.dispatchEvent(new Event("notifications:updated"));
  };

  const markRead = async (id) => {
    try {
      await api.notifications.markRead(id);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
      emitUpdate();
    } catch (err) {
      setError(err?.message || "Unable to mark notification as read.");
    }
  };

  const markAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
      emitUpdate();
    } catch (err) {
      setError(err?.message || "Unable to mark all notifications as read.");
    }
  };

  const unreadCount = items.filter((item) => !item.is_read).length;

  return (
    <section className="mx-auto w-full max-w-5xl">
      <div className="mb-4 rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-blue-900">Notifications</h2>
            <p className="mt-1 text-sm text-gray-600">
              Appointment and medication alerts in one inbox.
            </p>
          </div>
          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Mark all read
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-600">Loading notifications...</p>}
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          No notifications yet.
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className={`rounded-xl border p-4 shadow-sm ${
              item.is_read ? "border-gray-200 bg-white" : "border-blue-200 bg-blue-50/60"
            }`}
          >
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  kindStyles[item.kind] || "bg-gray-100 text-gray-700"
                }`}
              >
                {item.kind.replaceAll("_", " ")}
              </span>
            </div>
            <p className="text-sm text-gray-700">{item.message}</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-500">{formatTime(item.created_at)}</p>
              {!item.is_read && (
                <button
                  type="button"
                  onClick={() => markRead(item.id)}
                  className="rounded bg-white px-2 py-1 text-xs font-medium text-blue-700"
                >
                  Mark read
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Notifications;
