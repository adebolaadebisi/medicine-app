import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const weekdayOptions = [
  { value: 0, label: "Mon" },
  { value: 1, label: "Tue" },
  { value: 2, label: "Wed" },
  { value: 3, label: "Thu" },
  { value: 4, label: "Fri" },
  { value: 5, label: "Sat" },
  { value: 6, label: "Sun" },
];

const getTodayString = () => new Date().toISOString().slice(0, 10);

const createEmptyForm = () => ({
  medicine_name: "",
  dosage: "",
  reminder_time: "08:00",
  days_of_week: [0, 1, 2, 3, 4, 5, 6],
  instructions: "",
  start_date: getTodayString(),
  end_date: "",
  is_active: true,
});

const createEditForm = (reminder) => ({
  medicine_name: reminder.medicine_name,
  dosage: reminder.dosage,
  reminder_time: reminder.reminder_time,
  days_of_week: reminder.days_of_week || [],
  instructions: reminder.instructions || "",
  start_date: reminder.start_date,
  end_date: reminder.end_date || "",
  is_active: reminder.is_active,
});

const MedicationReminders = () => {
  const [form, setForm] = useState(createEmptyForm);
  const [reminders, setReminders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const summaryByReminderId = useMemo(() => {
    if (!summary?.items) return {};
    return Object.fromEntries(summary.items.map((item) => [item.reminder_id, item]));
  }, [summary]);

  const maxTrendRate = useMemo(() => {
    if (!trend.length) return 100;
    return Math.max(...trend.map((point) => point.adherence_rate), 100);
  }, [trend]);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [reminderRows, adherenceSummary, adherenceTrend] = await Promise.all([
        api.medicationReminders.list(),
        api.medicationReminders.adherenceSummary(),
        api.medicationReminders.adherenceTrend({ days: 7 }),
      ]);
      setReminders(reminderRows);
      setSummary(adherenceSummary);
      setTrend(adherenceTrend.points || []);
    } catch (err) {
      setError(err?.message || "Unable to load medication reminders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const toggleDay = (setter, value) => {
    setter((prev) => {
      const hasDay = prev.days_of_week.includes(value);
      const days_of_week = hasDay
        ? prev.days_of_week.filter((day) => day !== value)
        : [...prev.days_of_week, value];
      return { ...prev, days_of_week: days_of_week.sort((a, b) => a - b) };
    });
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.medicationReminders.create({
        ...form,
        end_date: form.end_date || null,
        instructions: form.instructions.trim() || null,
      });
      setForm(createEmptyForm());
      await loadAll();
    } catch (err) {
      setError(err?.message || "Unable to create reminder.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (reminder) => {
    setEditId(reminder.id);
    setEditForm(createEditForm(reminder));
    setError("");
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditForm(null);
  };

  const saveEdit = async (reminderId) => {
    if (!editForm) return;
    setError("");
    try {
      await api.medicationReminders.update(reminderId, {
        ...editForm,
        end_date: editForm.end_date || null,
        instructions: editForm.instructions.trim() || null,
      });
      cancelEdit();
      await loadAll();
    } catch (err) {
      setError(err?.message || "Unable to update reminder.");
    }
  };

  const updateReminder = async (id, updates) => {
    setError("");
    try {
      await api.medicationReminders.update(id, updates);
      await loadAll();
    } catch (err) {
      setError(err?.message || "Unable to update reminder.");
    }
  };

  const deleteReminder = async (id) => {
    setError("");
    try {
      await api.medicationReminders.remove(id);
      if (editId === id) cancelEdit();
      await loadAll();
    } catch (err) {
      setError(err?.message || "Unable to delete reminder.");
    }
  };

  const markStatus = async (id, status) => {
    setError("");
    try {
      await api.medicationReminders.markAdherence(id, { status });
      await loadAll();
    } catch (err) {
      setError(err?.message || "Unable to update adherence.");
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="mb-4 rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm sm:p-6">
        <h2 className="text-2xl font-bold text-blue-900">Medication Reminders</h2>
        <p className="mt-1 text-sm text-gray-600">
          Create reminders and track if today&apos;s medications were taken.
        </p>
      </div>

      {summary && (
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs uppercase text-blue-700">Due Today</p>
            <p className="text-2xl font-bold text-blue-900">{summary.total_due}</p>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 p-4">
            <p className="text-xs uppercase text-green-700">Taken</p>
            <p className="text-2xl font-bold text-green-900">{summary.taken}</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs uppercase text-amber-700">Pending</p>
            <p className="text-2xl font-bold text-amber-900">{summary.pending}</p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-xs uppercase text-indigo-700">Adherence</p>
            <p className="text-2xl font-bold text-indigo-900">{summary.adherence_rate}%</p>
          </div>
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">7-Day Adherence Trend</h3>
        {!trend.length && <p className="text-sm text-gray-600">No trend data yet.</p>}
        {trend.length > 0 && (
          <div className="grid grid-cols-7 gap-2">
            {trend.map((point) => {
              const height = Math.max((point.adherence_rate / maxTrendRate) * 100, 6);
              const dayLabel = new Date(point.date).toLocaleDateString("en-US", {
                weekday: "short",
              });
              return (
                <div key={point.date} className="flex flex-col items-center">
                  <div className="flex h-28 w-full items-end rounded bg-gray-50 p-1">
                    <div
                      className="w-full rounded bg-blue-600"
                      style={{ height: `${height}%` }}
                      title={`${point.date}: ${point.adherence_rate}% (${point.taken}/${point.total_due})`}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-600">{dayLabel}</p>
                  <p className="text-[10px] font-medium text-blue-700">{point.adherence_rate}%</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <form
          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-1"
          onSubmit={handleCreate}
        >
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Add Reminder</h3>

          <label className="mb-2 block text-xs font-medium text-gray-700">
            Medicine name
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.medicine_name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, medicine_name: event.target.value }))
              }
              required
            />
          </label>

          <label className="mb-2 block text-xs font-medium text-gray-700">
            Dosage
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.dosage}
              onChange={(event) => setForm((prev) => ({ ...prev, dosage: event.target.value }))}
              placeholder="1 tablet"
              required
            />
          </label>

          <label className="mb-2 block text-xs font-medium text-gray-700">
            Time
            <input
              type="time"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.reminder_time}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, reminder_time: event.target.value }))
              }
              required
            />
          </label>

          <div className="mb-2">
            <p className="mb-1 text-xs font-medium text-gray-700">Days</p>
            <div className="flex flex-wrap gap-1">
              {weekdayOptions.map((day) => {
                const selected = form.days_of_week.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    className={`rounded-md border px-2 py-1 text-xs ${
                      selected
                        ? "border-blue-700 bg-blue-700 text-white"
                        : "border-gray-300 bg-white text-gray-700"
                    }`}
                    onClick={() => toggleDay(setForm, day.value)}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-2 grid gap-2 sm:grid-cols-2">
            <label className="block text-xs font-medium text-gray-700">
              Start date
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={form.start_date}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, start_date: event.target.value }))
                }
                required
              />
            </label>
            <label className="block text-xs font-medium text-gray-700">
              End date
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={form.end_date}
                onChange={(event) => setForm((prev) => ({ ...prev, end_date: event.target.value }))}
              />
            </label>
          </div>

          <label className="mb-3 block text-xs font-medium text-gray-700">
            Instructions (optional)
            <textarea
              className="mt-1 min-h-20 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.instructions}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, instructions: event.target.value }))
              }
            />
          </label>

          <button
            type="submit"
            disabled={submitting || form.days_of_week.length === 0}
            className="w-full rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Add Reminder"}
          </button>
        </form>

        <div className="space-y-3 lg:col-span-2">
          {loading && <p className="text-sm text-gray-600">Loading reminders...</p>}
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {!loading && reminders.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
              No reminders yet. Add your first medication schedule.
            </div>
          )}

          {reminders.map((reminder) => {
            const todayItem = summaryByReminderId[reminder.id];
            const isEditing = editId === reminder.id && editForm;
            return (
              <article
                key={reminder.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900">Edit Reminder</h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={editForm.medicine_name}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, medicine_name: event.target.value }))
                        }
                        placeholder="Medicine"
                      />
                      <input
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={editForm.dosage}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, dosage: event.target.value }))
                        }
                        placeholder="Dosage"
                      />
                      <input
                        type="time"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={editForm.reminder_time}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, reminder_time: event.target.value }))
                        }
                      />
                      <select
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={editForm.is_active ? "active" : "inactive"}
                        onChange={(event) =>
                          setEditForm((prev) => ({
                            ...prev,
                            is_active: event.target.value === "active",
                          }))
                        }
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Paused</option>
                      </select>
                      <input
                        type="date"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={editForm.start_date}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, start_date: event.target.value }))
                        }
                      />
                      <input
                        type="date"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={editForm.end_date}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, end_date: event.target.value }))
                        }
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {weekdayOptions.map((day) => {
                        const selected = editForm.days_of_week.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            className={`rounded-md border px-2 py-1 text-xs ${
                              selected
                                ? "border-blue-700 bg-blue-700 text-white"
                                : "border-gray-300 bg-white text-gray-700"
                            }`}
                            onClick={() => toggleDay(setEditForm, day.value)}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                    <textarea
                      className="min-h-20 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      value={editForm.instructions}
                      onChange={(event) =>
                        setEditForm((prev) => ({ ...prev, instructions: event.target.value }))
                      }
                      placeholder="Instructions"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveEdit(reminder.id)}
                        disabled={editForm.days_of_week.length === 0}
                        className="rounded-md bg-blue-700 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-md bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">
                        {reminder.medicine_name}
                      </h4>
                      <p className="text-sm text-gray-700">
                        {reminder.dosage} at {reminder.reminder_time}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        Days:{" "}
                        {reminder.days_of_week
                          .map((value) => weekdayOptions.find((day) => day.value === value)?.label)
                          .join(", ")}
                      </p>
                      {reminder.instructions && (
                        <p className="mt-1 text-xs text-gray-600">{reminder.instructions}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(reminder)}
                        className="rounded-md bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => updateReminder(reminder.id, { is_active: !reminder.is_active })}
                        className={`rounded-md px-3 py-1 text-xs font-medium ${
                          reminder.is_active
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {reminder.is_active ? "Pause" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteReminder(reminder.id)}
                        className="rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {todayItem && !isEditing && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                    <span className="text-xs text-gray-600">Today:</span>
                    <button
                      type="button"
                      onClick={() => markStatus(reminder.id, "taken")}
                      className={`rounded-md px-3 py-1 text-xs font-medium ${
                        todayItem.status === "taken"
                          ? "bg-green-700 text-white"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      Taken
                    </button>
                    <button
                      type="button"
                      onClick={() => markStatus(reminder.id, "skipped")}
                      className={`rounded-md px-3 py-1 text-xs font-medium ${
                        todayItem.status === "skipped"
                          ? "bg-gray-700 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      Skipped
                    </button>
                    <span className="text-xs text-gray-500">
                      {todayItem.status
                        ? `Status: ${todayItem.status}`
                        : "No adherence status logged"}
                    </span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MedicationReminders;
