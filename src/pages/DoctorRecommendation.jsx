import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";

function DoctorRecommendation() {
  const location = useLocation();
  const navigate = useNavigate();
  const specialty = location.state?.specialty;
  const symptom = (location.state?.symptom || "").toLowerCase();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          </div>
        ))}
      </div>
    </div>
  );
}

export default DoctorRecommendation;
