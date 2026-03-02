import { useEffect, useState } from "react";

const DOCTORS = [
  { id: "d1", name: "Dr. Adeyemi", specialty: "General Physician", location: "Lagos", rating: 4.6 },
  { id: "d2", name: "Dr. Bello", specialty: "Cardiologist", location: "Abuja", rating: 4.8 },
  { id: "d3", name: "Dr. Hassan", specialty: "Dermatologist", location: "Ibadan", rating: 4.5 },
  { id: "d4", name: "Dr. Okafor", specialty: "Nutritionist", location: "Port Harcourt", rating: 4.7 },
];

export default function RecommendedDoctors({ symptomCategory }) {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    if (!symptomCategory) {
      setDoctors([]);
      return;
    }

    const query = symptomCategory.toLowerCase();
    setDoctors(
      DOCTORS.filter((doc) => doc.specialty.toLowerCase().includes(query))
    );
  }, [symptomCategory]);

  if (!doctors.length) return <p>No doctors found for this category.</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Recommended Doctors</h2>
      {doctors.map((doc) => (
        <div key={doc.id} className="p-4 border rounded my-2">
          <h3>{doc.name}</h3>
          <p>
            {doc.specialty} - {doc.location}
          </p>
          <p>Rating: {doc.rating || "N/A"}</p>
        </div>
      ))}
    </div>
  );
}
