import { useEffect, useState } from "react";
import { api } from "../services/api";

const StatCard = ({ label, value }) => (
  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
    <p className="text-xs uppercase tracking-wide text-blue-700">{label}</p>
    <p className="mt-1 text-2xl font-bold text-blue-900">{value}</p>
  </div>
);

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [resetEmail, setResetEmail] = useState("");
  const [customPassword, setCustomPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetResult, setResetResult] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [appointmentError, setAppointmentError] = useState("");
  const [appointmentBusyId, setAppointmentBusyId] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [overview, appointmentRows] = await Promise.all([
          api.admin.overview(),
          api.appointments.adminList({ limit: 20 }),
        ]);
        setData(overview);
        setAppointments(appointmentRows);
      } catch (err) {
        setError(err?.message || "Unable to load admin dashboard.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setResetLoading(true);
    setResetError("");
    setResetResult(null);
    try {
      const payload = {
        email: resetEmail.trim().toLowerCase(),
      };
      if (customPassword.trim()) {
        payload.new_password = customPassword.trim();
      }
      const response = await api.admin.resetUserPassword(payload);
      setResetResult(response);
      setCustomPassword("");
    } catch (err) {
      setResetError(err?.message || "Unable to reset password.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleAppointmentStatus = async (appointmentId, statusValue) => {
    setAppointmentBusyId(appointmentId);
    setAppointmentError("");
    try {
      const updated = await api.appointments.adminUpdate(appointmentId, { status: statusValue });
      setAppointments((prev) => prev.map((row) => (row.id === appointmentId ? updated : row)));
    } catch (err) {
      setAppointmentError(err?.message || "Unable to update appointment status.");
    } finally {
      setAppointmentBusyId(null);
    }
  };

  return (
    <section className="flex flex-1 items-center justify-center">
      <div className="flex w-full max-w-5xl flex-col rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur sm:p-8">
        <h2 className="mb-2 text-xl font-semibold text-blue-900 sm:text-2xl">
          Admin Dashboard
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Monitor users and app activity in one place.
        </p>

        {loading && <p className="text-sm text-gray-600">Loading admin overview...</p>}
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        {!loading && !error && data && (
          <>
            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-10">
              <StatCard label="Users" value={data.stats.total_users} />
              <StatCard label="Patients" value={data.stats.total_patients ?? 0} />
              <StatCard label="Caregivers" value={data.stats.total_caregivers ?? 0} />
              <StatCard
                label="Care Links Active"
                value={data.stats.total_active_caregiver_links ?? 0}
              />
              <StatCard
                label="Care Links Pending"
                value={data.stats.total_pending_caregiver_links ?? 0}
              />
              <StatCard label="Doctors" value={data.stats.total_doctors} />
              <StatCard label="Food Checks" value={data.stats.total_food_checks} />
              <StatCard label="Meal Plans" value={data.stats.total_meal_plans} />
              <StatCard
                label="Med Reminders"
                value={data.stats.total_medication_reminders ?? 0}
              />
              <StatCard label="Appointments" value={data.stats.total_appointments ?? 0} />
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="mb-2 text-sm font-semibold text-gray-900">Recent Patients</h3>
                <ul className="space-y-2 text-xs text-gray-700">
                  {(data.recent_patients || []).map((user) => (
                    <li key={user.id} className="rounded bg-gray-50 p-2">
                      <p className="font-medium">{user.full_name || "No name"}</p>
                      <p>{user.email}</p>
                      <button
                        type="button"
                        onClick={() => setResetEmail(user.email)}
                        className="mt-2 rounded bg-blue-100 px-2 py-1 text-[11px] font-medium text-blue-800"
                      >
                        Use this email
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="mb-2 text-sm font-semibold text-gray-900">Recent Caregivers</h3>
                <ul className="space-y-2 text-xs text-gray-700">
                  {(data.recent_caregivers || []).map((user) => (
                    <li key={user.id} className="rounded bg-gray-50 p-2">
                      <p className="font-medium">{user.full_name || "No name"}</p>
                      <p>{user.email}</p>
                      <button
                        type="button"
                        onClick={() => setResetEmail(user.email)}
                        className="mt-2 rounded bg-blue-100 px-2 py-1 text-[11px] font-medium text-blue-800"
                      >
                        Use this email
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="mb-2 text-sm font-semibold text-gray-900">Recent Food Checks</h3>
                <ul className="space-y-2 text-xs text-gray-700">
                  {data.recent_food_checks.map((item) => (
                    <li key={item.id} className="rounded bg-gray-50 p-2">
                      <p className="font-medium">{item.name}</p>
                      <p className="capitalize">{item.status}</p>
                      <p>{item.expiry}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="mb-2 text-sm font-semibold text-gray-900">Recent Meal Plans</h3>
                <ul className="space-y-2 text-xs text-gray-700">
                  {data.recent_meal_plans.map((item) => (
                    <li key={item.id} className="rounded bg-gray-50 p-2">
                      <p className="font-medium">
                        {item.plan_type} - {item.condition}
                      </p>
                      <p>{item.goal || "No goal"}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-900">Caregiver Link Status</h3>
              <p className="mt-1 text-xs text-gray-600">
                `pending` means caregiver has not accepted yet. `active` means accepted and working.
              </p>
              <div className="mt-3 space-y-2">
                {(data.recent_caregiver_links || []).length === 0 && (
                  <p className="text-xs text-gray-600">No caregiver links yet.</p>
                )}
                {(data.recent_caregiver_links || []).map((link) => (
                  <div
                    key={link.id}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs"
                  >
                    <p className="font-medium text-gray-900">
                      {link.patient_email} {"->"} {link.caregiver_email}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 font-semibold ${
                          link.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : link.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {link.status}
                      </span>
                      <span className="text-gray-600">
                        Invited: {new Date(link.created_at).toLocaleString()}
                      </span>
                      {link.accepted_at && (
                        <span className="text-gray-600">
                          Accepted: {new Date(link.accepted_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-900">Manage Appointments</h3>
              {appointmentError && (
                <p className="mt-1 text-xs font-medium text-red-600">{appointmentError}</p>
              )}
              <div className="mt-3 space-y-2">
                {appointments.length === 0 && (
                  <p className="text-xs text-gray-600">No appointments yet.</p>
                )}
                {appointments.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs"
                  >
                    <p className="font-semibold text-gray-900">
                      {item.doctor_name} ({item.doctor_specialty})
                    </p>
                    <p className="text-gray-700">
                      {new Date(item.appointment_time).toLocaleString()} |{" "}
                      <span className="capitalize">{item.status}</span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {["confirmed", "completed", "rejected", "cancelled", "pending"].map(
                        (statusOption) => (
                          <button
                            key={statusOption}
                            type="button"
                            disabled={appointmentBusyId === item.id}
                            onClick={() => handleAppointmentStatus(item.id, statusOption)}
                            className={`rounded px-2 py-1 ${
                              item.status === statusOption
                                ? "bg-blue-700 text-white"
                                : "bg-white text-blue-700"
                            }`}
                          >
                            {statusOption}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-900">Reset User Password</h3>
              <p className="mt-1 text-xs text-gray-600">
                For support requests. This resets the password and gives a temporary one to share.
              </p>

              <form className="mt-3 grid gap-2 sm:grid-cols-3" onSubmit={handleResetPassword}>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  placeholder="user@email.com"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={customPassword}
                  onChange={(event) => setCustomPassword(event.target.value)}
                  placeholder="Optional custom password"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {resetLoading ? "Resetting..." : "Reset Password"}
                </button>
              </form>

              {resetError && <p className="mt-2 text-xs font-medium text-red-600">{resetError}</p>}
              {resetResult && (
                <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-900">
                  <p>
                    Password reset for <span className="font-semibold">{resetResult.email}</span>.
                  </p>
                  <p className="mt-1">
                    Temporary password:{" "}
                    <span className="rounded bg-white px-2 py-1 font-mono text-sm">
                      {resetResult.temporary_password}
                    </span>
                  </p>
                  <p className="mt-1 text-[11px] text-green-800">
                    Ask the user to log in and change this password immediately.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default AdminDashboard;
