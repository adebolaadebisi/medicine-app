import { useState } from "react";
import { useNavigate } from "react-router-dom";

const getDiagnosisSummary = (symptomInput) => {
  const normalized = symptomInput.toLowerCase();

  if (normalized.includes("headache") || normalized.includes("head pain")) {
    return {
      specialty: "Neurologist",
      possibleCauses: [
        "Tension headache from stress",
        "Dehydration",
        "Poor sleep",
        "Eye strain",
      ],
      advice: [
        "Drink water and rest in a quiet room.",
        "Reduce screen time for a while and relax your eyes.",
        "Avoid skipping meals.",
        "If severe, sudden, or frequent, seek medical care.",
      ],
      redFlags: [
        "Sudden worst headache of your life",
        "Headache with confusion, weakness, or fainting",
        "Headache after head injury",
      ],
    };
  }

  if (normalized.includes("heart") || normalized.includes("chest")) {
    return {
      specialty: "Cardiologist",
      possibleCauses: [
        "Muscle strain",
        "Acid reflux",
        "Stress or anxiety",
        "Heart-related issue",
      ],
      advice: [
        "Stop activity and rest.",
        "If pain is severe or spreads to arm, jaw, or back, seek emergency care.",
        "Do not ignore ongoing chest discomfort.",
      ],
      redFlags: [
        "Chest pain with shortness of breath",
        "Pain spreading to arm, neck, jaw, or back",
        "Sweating, nausea, or feeling faint",
      ],
    };
  }

  if (normalized.includes("skin") || normalized.includes("rash")) {
    return {
      specialty: "Dermatologist",
      possibleCauses: [
        "Allergic reaction",
        "Irritant contact",
        "Fungal or bacterial infection",
      ],
      advice: [
        "Keep the area clean and dry.",
        "Avoid scratching or harsh skin products.",
        "Seek medical advice if rash spreads quickly or persists.",
      ],
      redFlags: [
        "Rash with trouble breathing",
        "Rash with high fever",
        "Rapidly spreading painful rash",
      ],
    };
  }

  if (normalized.includes("diet") || normalized.includes("weight")) {
    return {
      specialty: "Nutritionist",
      possibleCauses: [
        "Unbalanced meal pattern",
        "Low fiber or protein intake",
        "Inconsistent hydration",
      ],
      advice: [
        "Follow balanced meals with vegetables, protein, and whole grains.",
        "Drink enough water during the day.",
        "Track meals for one week to identify patterns.",
      ],
      redFlags: [
        "Rapid unexplained weight loss",
        "Persistent vomiting or inability to eat",
        "Signs of severe dehydration",
      ],
    };
  }

  if (
    normalized.includes("fever") ||
    normalized.includes("cold") ||
    normalized.includes("cough") ||
    normalized.includes("flu")
  ) {
    return {
      specialty: "General Physician",
      possibleCauses: [
        "Viral infection",
        "Mild respiratory infection",
        "Seasonal flu",
      ],
      advice: [
        "Rest and stay hydrated.",
        "Monitor temperature and symptoms over 24 to 48 hours.",
        "Seek medical care if symptoms worsen or breathing becomes difficult.",
      ],
      redFlags: [
        "Very high fever that does not come down",
        "Difficulty breathing",
        "Severe weakness or confusion",
      ],
    };
  }

  return {
    specialty: "General Physician",
    possibleCauses: [
      "Mild infection",
      "Stress-related symptoms",
      "Lifestyle factors such as poor sleep or hydration",
    ],
    advice: [
      "Rest, hydrate, and monitor your symptoms closely.",
      "Avoid self-medicating beyond basic care.",
      "If symptoms worsen or continue, consult a doctor.",
    ],
    redFlags: [
      "Symptoms that suddenly worsen",
      "Difficulty breathing",
      "High fever that does not improve",
    ],
  };
};

function Diagnosis() {
  const [symptom, setSymptom] = useState("");
  const [severity, setSeverity] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleDiagnosis = () => {
    if (!symptom.trim()) {
      setError("Please describe your symptoms.");
      return;
    }

    if (!severity) {
      setError("Please select how severe your symptoms feel.");
      return;
    }

    setError("");
    setResult({ ...getDiagnosisSummary(symptom), userSeverity: severity });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <h2 className="mb-6 text-center text-2xl font-bold text-blue-800 sm:text-3xl">
        Symptom Diagnosis
      </h2>

      <div className="mx-auto max-w-xl rounded-2xl bg-white p-4 shadow-lg sm:p-6">
        <input
          type="text"
          placeholder="Describe your symptoms..."
          value={symptom}
          onChange={(event) => setSymptom(event.target.value)}
          className="mb-4 w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Your symptom severity
        </label>
        <div className="mb-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setSeverity("Low")}
            className={`rounded-lg border p-2 text-sm font-semibold ${
              severity === "Low"
                ? "border-green-600 bg-green-50 text-green-700"
                : "border-gray-300 text-gray-700"
            }`}
          >
            Low
          </button>
          <button
            type="button"
            onClick={() => setSeverity("Medium")}
            className={`rounded-lg border p-2 text-sm font-semibold ${
              severity === "Medium"
                ? "border-amber-600 bg-amber-50 text-amber-700"
                : "border-gray-300 text-gray-700"
            }`}
          >
            Medium
          </button>
          <button
            type="button"
            onClick={() => setSeverity("High")}
            className={`rounded-lg border p-2 text-sm font-semibold ${
              severity === "High"
                ? "border-red-600 bg-red-50 text-red-700"
                : "border-gray-300 text-gray-700"
            }`}
          >
            High
          </button>
        </div>

        {error && <p className="mb-4 text-sm font-medium text-red-600">{error}</p>}

        <button
          onClick={handleDiagnosis}
          className="w-full rounded-lg bg-blue-700 p-3 text-white transition hover:bg-blue-800"
        >
          Analyze Symptoms
        </button>
      </div>

      {result && (
        <div className="mx-auto mt-6 max-w-xl rounded-2xl bg-white p-4 shadow-lg sm:p-6">
          <div className="mb-4 rounded-lg bg-blue-50 p-3">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Your reported severity:</span>{" "}
              {result.userSeverity}
            </p>
          </div>

          <h3 className="mb-2 text-xl font-bold text-blue-800">
            Possible causes
          </h3>
          <ul className="mb-4 list-disc space-y-1 pl-5 text-gray-700">
            {result.possibleCauses.map((cause) => (
              <li key={cause}>{cause}</li>
            ))}
          </ul>

          <h3 className="mb-2 text-xl font-bold text-blue-800">
            Health advice
          </h3>
          <ul className="mb-4 list-disc space-y-1 pl-5 text-gray-700">
            {result.advice.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>

          <h3 className="mb-2 text-xl font-bold text-red-700">
            Red-flag warning signs
          </h3>
          <ul className="mb-4 list-disc space-y-1 pl-5 text-red-700">
            {result.redFlags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>

          <p className="mb-4 text-sm text-gray-600">
            You can choose to continue with self-care or consult a doctor.
          </p>

          <button
            onClick={() =>
              navigate("/doctors", {
                state: { specialty: result.specialty, symptom },
              })
            }
            className="w-full rounded-lg bg-green-600 p-3 font-semibold text-white transition hover:bg-green-700"
          >
            See Recommended Doctors (Optional)
          </button>
        </div>
      )}
    </div>
  );
}

export default Diagnosis;
