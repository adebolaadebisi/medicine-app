import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";

const getDefaultAppointmentTime = () => {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(9, 0, 0, 0);
  const offset = next.getTimezoneOffset();
  const local = new Date(next.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

function DoctorRecommendation() {
  const location = useLocation();
  const navigate = useNavigate();
  const specialty = location.state?.specialty;
  const symptom = (location.state?.symptom || "").toLowerCase();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingDoctorId, setBookingDoctorId] = useState(null);
  const [bookingForm, setBookingForm] = useState({ appointmentTime: "", appointmentReason: "" });
  const [bookingLoadingId, setBookingLoadingId] = useState(null);
  const [bookingMessage, setBookingMessage] = useState("");

  useEffect(() => {
    const loadDoctors = async () => {
      setLoading(true);
      setError("");
      try {
        const bySpecialty = await api.doctors.list({ specialty });
        const byQuery = symptom ? await api.doctors.list({ q: symptom }) : [];
        const merged = [
          ...bySpecialty,
          ...byQuery.filter(
            (doc) => !bySpecialty.some((existing) => existing.id === doc.id)
          ),
        ];
        setDoctors(merged.length > 0 ? merged : bySpecialty.length > 0 ? bySpecialty : await api.doctors.list());
      } catch (err) {
        setError(err?.message || "Unable to load doctors.");
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, [specialty, symptom]);

  const doctorsToShow = doctors;

  const handleBook = async (doctorId) => {
    const appointmentTime = bookingForm.appointmentTime;
    const appointmentReason = bookingForm.appointmentReason;
    if (!appointmentTime) {
      setError("Select appointment date and time first.");
      return;
    }
    setBookingLoadingId(doctorId);
    setError("");
    setBookingMessage("");
    try {
      await api.appointments.create({
        doctor_id: doctorId,
        appointment_time: new Date(appointmentTime).toISOString(),
        mode: "video",
        reason: appointmentReason.trim() || null,
      });
      setBookingMessage("Appointment request submitted. Check My Appointments for status.");
      setBookingDoctorId(null);
      setBookingForm({ appointmentTime: "", appointmentReason: "" });
    } catch (err) {
      setError(err?.message || "Unable to create appointment.");
    } finally {
      setBookingLoadingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <h2 className="mb-6 text-center text-2xl font-bold text-blue-800 sm:text-3xl">
        Recommended Doctors
      </h2>

      <div className="mx-auto max-w-xl rounded-2xl bg-white p-4 shadow-lg sm:p-6">
        {specialty ? (
          <p className="mb-4 text-center text-gray-700">
            Based on your symptoms, you should see a:
            <span className="font-bold text-blue-700"> {specialty}</span>
          </p>
        ) : (
          <p className="mb-4 text-center text-gray-500">
            Showing available doctors. Run diagnosis for more targeted matches.
          </p>
        )}

        {loading && <p className="text-center text-gray-500">Loading doctors...</p>}
        {!loading && error && (
          <p className="text-center text-red-600">{error}</p>
        )}
        {!loading && !error && bookingMessage && (
          <p className="text-center text-emerald-700">{bookingMessage}</p>
        )}
        {!loading && !error && doctorsToShow.length === 0 && (
          <p className="text-center text-gray-500">No doctors found.</p>
        )}

        {!loading && !error && doctorsToShow.map((doc) => (
          <div
            key={doc.id}
            className="mb-3 rounded-lg border bg-blue-50 p-4 text-left sm:text-center"
          >
            <p className="text-lg font-bold">{doc.name}</p>
            <p className="text-gray-600">{doc.specialty}</p>
            <button
              onClick={() =>
                navigate("/video-consultation", { state: { doctor: doc } })
              }
              className="mt-4 w-full rounded-xl bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-700 sm:w-auto"
            >
              Start Video Consultation
            </button>
            <button
              type="button"
              onClick={() =>
                setBookingDoctorId((id) => {
                  if (id === doc.id) return null;
                  setBookingForm({
                    appointmentTime: getDefaultAppointmentTime(),
                    appointmentReason: "",
                  });
                  return doc.id;
                })
              }
              className="mt-2 w-full rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 sm:w-auto sm:ml-2"
            >
              Book Appointment
            </button>
            {bookingDoctorId === doc.id && (
              <div className="mt-3 rounded-lg border border-blue-100 bg-white p-3 text-left">
                <label className="mb-2 block text-xs font-medium text-gray-700">
                  Date & time
                  <input
                    type="datetime-local"
                    value={bookingForm.appointmentTime}
                    onChange={(event) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        appointmentTime: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                </label>
                <label className="mb-2 block text-xs font-medium text-gray-700">
                  Reason (optional)
                  <input
                    type="text"
                    value={bookingForm.appointmentReason}
                    onChange={(event) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        appointmentReason: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    placeholder="Brief reason for visit"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => handleBook(doc.id)}
                  disabled={bookingLoadingId === doc.id || !bookingForm.appointmentTime}
                  className="rounded bg-blue-700 px-3 py-1 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {bookingLoadingId === doc.id ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DoctorRecommendation;
