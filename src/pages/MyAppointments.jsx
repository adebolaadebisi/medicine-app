import { useEffect, useState } from "react";
import { api } from "../services/api";

const canUserModify = (status) => !["completed", "cancelled", "rejected"].includes(status);

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rescheduleId, setRescheduleId] = useState(null);
  const [newTime, setNewTime] = useState("");
  const [newReason, setNewReason] = useState("");

  const loadAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.appointments.list();
      setAppointments(response);
    } catch (err) {
      setError(err?.message || "Unable to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancel = async (id) => {
    setError("");
    try {
      await api.appointments.cancel(id);
      await loadAppointments();
    } catch (err) {
      setError(err?.message || "Unable to cancel appointment.");
    }
  };

  const handleReschedule = async (id) => {
    if (!newTime) {
      setError("Choose a new date and time first.");
      return;
    }
    setError("");
    try {
      await api.appointments.reschedule(id, {
        appointment_time: new Date(newTime).toISOString(),
        reason: newReason.trim() || null,
      });
      setRescheduleId(null);
      setNewTime("");
      setNewReason("");
      await loadAppointments();
    } catch (err) {
      setError(err?.message || "Unable to reschedule appointment.");
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl">
      <div className="mb-4 rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm sm:p-6">
        <h2 className="text-2xl font-bold text-blue-900">My Appointments</h2>
        <p className="mt-1 text-sm text-gray-600">
          Track your doctor bookings and update pending requests.
        </p>
      </div>

      {loading && <p className="text-sm text-gray-600">Loading appointments...</p>}
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {!loading && appointments.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          No appointments yet. Book from Doctor Recommendations.
        </div>
      )}

      <div className="space-y-3">
        {appointments.map((item) => (
          <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{item.doctor_name}</h3>
                <p className="text-sm text-gray-700">{item.doctor_specialty}</p>
                <p className="text-xs text-gray-600">
                  {new Date(item.appointment_time).toLocaleString()} ({item.mode})
                </p>
                <p className="mt-1 text-xs">
                  <span className="font-medium">Status:</span>{" "}
                  <span className="capitalize">{item.status}</span>
                </p>
                {item.reason && <p className="text-xs text-gray-600">Reason: {item.reason}</p>}
                {item.admin_notes && (
                  <p className="text-xs text-amber-700">Admin note: {item.admin_notes}</p>
                )}
              </div>

              {canUserModify(item.status) && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRescheduleId((id) => (id === item.id ? null : item.id))}
                    className="rounded-md bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                  >
                    Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancel(item.id)}
                    className="rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-800"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {rescheduleId === item.id && (
              <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                <label className="mb-2 block text-xs font-medium text-gray-700">
                  New date & time
                  <input
                    type="datetime-local"
                    value={newTime}
                    onChange={(event) => setNewTime(event.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                </label>
                <label className="mb-2 block text-xs font-medium text-gray-700">
                  Reason (optional)
                  <input
                    type="text"
                    value={newReason}
                    onChange={(event) => setNewReason(event.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => handleReschedule(item.id)}
                  className="rounded bg-blue-700 px-3 py-1 text-xs font-semibold text-white"
                >
                  Submit Reschedule
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

export default MyAppointments;
