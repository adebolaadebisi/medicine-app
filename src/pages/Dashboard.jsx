import { useNavigate } from "react-router-dom";
import ButtonCard from "../components/ButtonCard";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="py-4 sm:py-8">
      <h2 className="mb-6 text-center text-2xl font-bold text-blue-800 sm:mb-8 sm:text-3xl">
        User Dashboard
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
        <ButtonCard
          icon="🩺"
          title="Diagnose Symptoms"
          description="AI chatbot for symptom analysis."
          onClick={() => navigate("/diagnosis")}
        />

        <ButtonCard
          icon="🥗"
          title="Food Helper"
          description="Get a quick personalized daily diet guide."
          onClick={() => navigate("/prescription")}
        />

        <ButtonCard
          icon="🗓️"
          title="Monthly Meal Plan"
          description="Open a full 4-week condition-based meal schedule."
          onClick={() => navigate("/monthly-plan")}
        />

        <ButtonCard
          icon="📦"
          title="Expiry Check"
          description="Check food and medicine expiry."
          onClick={() => navigate("/food-check")}
        />

        <ButtonCard
          icon="👨🏽‍⚕️"
          title="Recommend Doctors"
          description="Find suitable doctors based on symptoms."
          onClick={() => navigate("/doctors")}
        />
      </div>
    </div>
  );
};

export default Dashboard;
