import { useEffect, useState } from "react";
import { api } from "../services/api";

const CaregiverHub = () => {
  const [inviteEmail, setInviteEmail] = useState("");
  const [mine, setMine] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [mineRows, assignedRows] = await Promise.all([
        api.caregiver.mine(),
        api.caregiver.assigned(),
      ]);
      setMine(mineRows);
      setAssigned(assignedRows);
    } catch (err) {
      setError(err?.message || "Unable to load caregiver data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const invite = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.caregiver.invite({ caregiver_email: inviteEmail.trim().toLowerCase() });
      setInviteEmail("");
      setSuccess("Caregiver invite sent.");
      await load();
    } catch (err) {
      setError(err?.message || "Unable to send invite.");
    }
  };

  const accept = async (id) => {
    setError("");
    try {
      await api.caregiver.accept(id);
      await load();
    } catch (err) {
      setError(err?.message || "Unable to accept invite.");
    }
  };

  const revoke = async (id) => {
    setError("");
    try {
      await api.caregiver.revoke(id);
      await load();
    } catch (err) {
      setError(err?.message || "Unable to revoke link.");
    }
  };

  const openOverview = async (patientId) => {
    setError("");
    try {
      const response = await api.caregiver.patientOverview(patientId);
      setOverview(response);
    } catch (err) {
      setError(err?.message || "Unable to load patient overview.");
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="mb-4 rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm sm:p-6">
        <h2 className="text-2xl font-bold text-blue-900">Caregiver Hub</h2>
        <p className="mt-1 text-sm text-gray-600">
          Invite caregivers and monitor linked patients with consent.
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Only users who registered with account type <span className="font-semibold">Caregiver</span>{" "}
          can be invited.
        </p>
      </div>

      {loading && <p className="text-sm text-gray-600">Loading caregiver links...</p>}
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {success && <p className="text-sm font-medium text-emerald-700">{success}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Invite a Caregiver</h3>
          <form className="flex flex-wrap gap-2" onSubmit={invite}>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="caregiver@email.com"
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
            >
              Invite
            </button>
          </form>

          <h4 className="mt-4 text-xs font-semibold uppercase text-gray-500">My Caregiver Links</h4>
          <div className="mt-2 space-y-2">
            {mine.length === 0 && <p className="text-xs text-gray-600">No caregiver links yet.</p>}
            {mine.map((item) => (
              <div key={item.id} className="rounded border border-gray-100 bg-gray-50 p-2 text-xs">
                <p className="font-medium text-gray-900">{item.caregiver_email}</p>
                <p className="capitalize text-gray-700">Status: {item.status}</p>
                {item.status !== "revoked" && (
                  <button
                    type="button"
                    onClick={() => revoke(item.id)}
                    className="mt-1 rounded bg-red-100 px-2 py-1 font-medium text-red-800"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Assigned to Me as Caregiver</h3>
          <div className="space-y-2">
            {assigned.length === 0 && <p className="text-xs text-gray-600">No assigned patients.</p>}
            {assigned.map((item) => (
              <div key={item.id} className="rounded border border-gray-100 bg-gray-50 p-2 text-xs">
                <p className="font-medium text-gray-900">{item.patient_email}</p>
                <p className="capitalize text-gray-700">Status: {item.status}</p>
                <div className="mt-1 flex gap-2">
                  {item.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => accept(item.id)}
                      className="rounded bg-emerald-100 px-2 py-1 font-medium text-emerald-800"
                    >
                      Accept
                    </button>
                  )}
                  {item.status === "active" && (
                    <button
                      type="button"
                      onClick={() => openOverview(item.patient_user_id)}
                      className="rounded bg-blue-100 px-2 py-1 font-medium text-blue-800"
                    >
                      View Overview
                    </button>
                  )}
                  {item.status !== "revoked" && (
                    <button
                      type="button"
                      onClick={() => revoke(item.id)}
                      className="rounded bg-red-100 px-2 py-1 font-medium text-red-800"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {overview && (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">
            Patient Overview: {overview.patient_name || overview.patient_email}
          </h3>
          <div className="mt-3 grid gap-4 lg:grid-cols-3">
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-500">Recent Vitals</h4>
              <ul className="mt-1 space-y-1 text-xs text-gray-700">
                {overview.recent_vitals.slice(0, 5).map((row) => (
                  <li key={row.id} className="rounded bg-gray-50 p-2">
                    {new Date(row.measured_at).toLocaleString()} | BP:{" "}
                    {row.systolic_bp && row.diastolic_bp
                      ? `${row.systolic_bp}/${row.diastolic_bp}`
                      : "--"}{" "}
                    | G: {row.glucose_mg_dl ?? "--"}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-500">Recent Risk Flags</h4>
              <ul className="mt-1 space-y-1 text-xs text-gray-700">
                {overview.recent_vital_flags.slice(0, 5).map((row, idx) => (
                  <li
                    key={`${row.metric}-${row.measured_at}-${idx}`}
                    className={`rounded p-2 ${row.emergency ? "bg-red-50 text-red-800" : "bg-amber-50"}`}
                  >
                    {row.metric}: {row.message}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-500">Upcoming Appointments</h4>
              <ul className="mt-1 space-y-1 text-xs text-gray-700">
                {overview.upcoming_appointments.slice(0, 5).map((row) => (
                  <li key={row.id} className="rounded bg-gray-50 p-2">
                    {row.doctor_name} | {new Date(row.appointment_time).toLocaleString()} |{" "}
                    <span className="capitalize">{row.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CaregiverHub;
