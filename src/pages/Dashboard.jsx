import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ButtonCard from "../components/ButtonCard";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canAccessAdmin = !!user?.isAdmin;
  const isCaregiver = !!user?.isCaregiver;
  const [adherence, setAdherence] = useState(null);
  const [adherenceError, setAdherenceError] = useState("");
  const [pendingCaregiverLinks, setPendingCaregiverLinks] = useState([]);
  const [caregiverError, setCaregiverError] = useState("");
  const [acceptingLinkId, setAcceptingLinkId] = useState(null);

  useEffect(() => {
    const loadAdherence = async () => {
      try {
        const summary = await api.medicationReminders.adherenceSummary();
        setAdherence(summary);
      } catch (error) {
        setAdherenceError(error?.message || "Unable to load adherence summary.");
      }
    };
    loadAdherence();
  }, []);

  useEffect(() => {
    const loadCaregiverInvites = async () => {
      if (!isCaregiver) return;
      setCaregiverError("");
      try {
        const assigned = await api.caregiver.assigned();
        setPendingCaregiverLinks(assigned.filter((item) => item.status === "pending"));
      } catch (error) {
        setCaregiverError(error?.message || "Unable to load caregiver invites.");
      }
    };
    loadCaregiverInvites();
  }, [isCaregiver]);

  const acceptCaregiverLink = async (linkId) => {
    setAcceptingLinkId(linkId);
    setCaregiverError("");
    try {
      await api.caregiver.accept(linkId);
      setPendingCaregiverLinks((prev) => prev.filter((link) => link.id !== linkId));
      window.dispatchEvent(new Event("notifications:updated"));
    } catch (error) {
      setCaregiverError(error?.message || "Unable to accept caregiver invite.");
    } finally {
      setAcceptingLinkId(null);
    }
  };

  return (
    <div className="py-4 sm:py-8">
      <h2 className="mb-6 text-center text-2xl font-bold text-blue-800 sm:mb-8 sm:text-3xl">
        User Dashboard
      </h2>

      <div className="mb-6 rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Today&apos;s Medication Adherence</h3>
            {adherence && (
              <p className="text-sm text-gray-600">
                {adherence.taken}/{adherence.total_due} taken, {adherence.pending} pending (
                {adherence.adherence_rate}%)
              </p>
            )}
            {!adherence && !adherenceError && (
              <p className="text-sm text-gray-600">Loading adherence summary...</p>
            )}
            {adherenceError && <p className="text-sm font-medium text-red-600">{adherenceError}</p>}
          </div>
          <button
            type="button"
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            onClick={() => navigate("/medication-reminders")}
          >
            Open Reminders
          </button>
        </div>
      </div>

      {isCaregiver && (
        <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold text-emerald-900">Caregiver Invites</h3>
          {caregiverError && <p className="mt-1 text-sm font-medium text-red-600">{caregiverError}</p>}
          {!caregiverError && pendingCaregiverLinks.length === 0 && (
            <p className="mt-1 text-sm text-emerald-800">
              No pending caregiver invites right now.
            </p>
          )}
          <div className="mt-2 space-y-2">
            {pendingCaregiverLinks.map((link) => (
              <div
                key={link.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3 text-sm"
              >
                <p className="text-gray-800">
                  Patient invite from <span className="font-semibold">{link.patient_email}</span>
                </p>
                <button
                  type="button"
                  onClick={() => acceptCaregiverLink(link.id)}
                  disabled={acceptingLinkId === link.id}
                  className="rounded bg-emerald-700 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {acceptingLinkId === link.id ? "Accepting..." : "Accept Invite"}
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate("/caregiver")}
            className="mt-3 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-800"
          >
            Open Caregiver Hub
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
        <ButtonCard
          icon="DX"
          title="Diagnose Symptoms"
          description="AI chatbot for symptom analysis."
          onClick={() => navigate("/diagnosis")}
        />

        <ButtonCard
          icon="FD"
          title="Food Helper"
          description="Get a quick personalized daily diet guide."
          onClick={() => navigate("/prescription")}
        />

        <ButtonCard
          icon="MP"
          title="Monthly Meal Plan"
          description="Open a full 4-week condition-based meal schedule."
          onClick={() => navigate("/monthly-plan")}
        />

        <ButtonCard
          icon="EX"
          title="Expiry Check"
          description="Check food and medicine expiry."
          onClick={() => navigate("/food-check")}
        />

        <ButtonCard
          icon="DR"
          title="Recommend Doctors"
          description="Find suitable doctors based on symptoms."
          onClick={() => navigate("/doctors")}
        />
        <ButtonCard
          icon="MR"
          title="Medication Reminders"
          description="Create schedules and track daily adherence."
          onClick={() => navigate("/medication-reminders")}
        />
        <ButtonCard
          icon="TL"
          title="Health Timeline"
          description="Review your health journey in one place."
          onClick={() => navigate("/timeline")}
        />
        <ButtonCard
          icon="AP"
          title="My Appointments"
          description="Manage your doctor booking requests."
          onClick={() => navigate("/appointments")}
        />
        <ButtonCard
          icon="NT"
          title="Notifications"
          description="View alerts for appointments and reminders."
          onClick={() => navigate("/notifications")}
        />
        <ButtonCard
          icon="VT"
          title="Vitals Tracker"
          description="Log blood pressure, glucose, weight, and pulse."
          onClick={() => navigate("/vitals")}
        />
        <ButtonCard
          icon="CG"
          title="Caregiver Hub"
          description="Invite caregivers and manage shared care access."
          onClick={() => navigate("/caregiver")}
        />

        {canAccessAdmin && (
          <ButtonCard
            icon="AD"
            title="Admin Dashboard"
            description="View users and app activity."
            onClick={() => navigate("/admin")}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
