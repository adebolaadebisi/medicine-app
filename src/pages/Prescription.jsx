import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

const HELPER_PLAN_LABELS = {
  general: "General healthy balance",
  bloodSugar: "Blood sugar support",
  heartFriendly: "Heart-friendly / low salt",
  digestiveComfort: "Digestive comfort",
  ironBoost: "Iron boost",
  pregnancySafe: "Pregnancy-safe meals",
  healthyWeightGain: "Healthy weight gain",
};

const HELPER_PLAN_TEMPLATES = {
  general: {
    focus: "General healthy eating pattern for everyday wellness.",
    avoid: ["Sugary drinks", "Highly processed snacks"],
    meals: {
      breakfast: ["Oats with fruit and a source of protein"],
      lunch: [
        "Balanced plate: half vegetables, quarter protein, quarter whole grains",
      ],
      dinner: ["Light dinner with vegetables and lean protein"],
      snacks: ["Fruit, nuts, or yogurt instead of sugary snacks"],
    },
  },
  bloodSugar: {
    focus: "Support stable blood sugar across the day.",
    avoid: ["Sugary drinks", "Large refined-carb portions"],
    meals: {
      breakfast: ["Plain oats with nuts and berries, no added sugar"],
      lunch: ["Grilled protein with vegetables and a small portion of brown rice"],
      dinner: ["Vegetable-rich soup with lean protein"],
      snacks: ["Whole fruit, nuts, or unsweetened yogurt"],
    },
  },
  heartFriendly: {
    focus: "Lower sodium and support heart health.",
    avoid: ["Processed meats", "Instant noodles", "Salty packaged foods"],
    meals: {
      breakfast: ["Banana oatmeal with low-fat milk"],
      lunch: ["Beans, grilled fish, and steamed vegetables with little salt"],
      dinner: ["Boiled sweet potato with mixed vegetables and lean protein"],
      snacks: ["Unsalted nuts and fresh fruit"],
    },
  },
  ironBoost: {
    focus: "Increase iron intake and absorption.",
    avoid: ["Tea/coffee with iron-rich meals"],
    meals: {
      breakfast: ["Fortified cereal with fruit rich in vitamin C"],
      lunch: ["Beans or lean meat with leafy greens"],
      dinner: ["Fish/chicken with spinach and citrus fruit"],
      snacks: ["Nuts, seeds, and dried fruit in moderation"],
    },
  },
  digestiveComfort: {
    focus: "Reduce acid reflux triggers and heavy late meals.",
    avoid: ["Spicy foods", "Very fatty meals", "Late-night large meals"],
    meals: {
      breakfast: ["Oats, banana, and low-fat yogurt"],
      lunch: ["Mild grilled chicken with rice and steamed vegetables"],
      dinner: ["Small portion of soft cooked vegetables with lean protein"],
      snacks: ["Crackers, banana, or plain yogurt"],
    },
  },
  pregnancySafe: {
    focus: "Support mother and baby nutrition needs.",
    avoid: ["Raw/undercooked foods", "Unpasteurized dairy"],
    meals: {
      breakfast: ["Whole grains, eggs, and fruit"],
      lunch: ["Well-cooked proteins with vegetables and complex carbs"],
      dinner: ["Balanced plate with iron and calcium sources"],
      snacks: ["Frequent small healthy snacks to reduce nausea"],
    },
  },
  healthyWeightGain: {
    focus: "Increase healthy calories and protein.",
    avoid: ["Skipping meals"],
    meals: {
      breakfast: ["Oats with milk, peanut butter, and banana"],
      lunch: ["Rice/potatoes with protein, vegetables, and healthy oils"],
      dinner: ["Whole-grain meal with lean protein and avocado"],
      snacks: ["Yogurt smoothies, nuts, and calorie-dense healthy snacks"],
    },
  },
};

const Prescription = () => {
  const navigate = useNavigate();
  const [helperCondition, setHelperCondition] = useState("general");
  const [activity, setActivity] = useState("moderate");
  const [goal, setGoal] = useState("balance");
  const [plan, setPlan] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const planRef = useRef(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const rows = await api.mealPlans.list({ plan_type: "daily", limit: 5 });
        setHistory(rows);
      } catch (err) {
        setError(err?.message || "Failed to load meal plan history.");
      }
    };
    loadHistory();
  }, []);

  const handleGenerate = async (event) => {
    event.preventDefault();

    const template =
      HELPER_PLAN_TEMPLATES[helperCondition] || HELPER_PLAN_TEMPLATES.general;
    const meals = {
      breakfast: [...template.meals.breakfast],
      lunch: [...template.meals.lunch],
      dinner: [...template.meals.dinner],
      snacks: [...template.meals.snacks],
    };

    if (goal === "weight-loss") {
      meals.snacks = [
        "Cut snacks to one or two per day, focusing on vegetables or fruit",
      ];
      meals.dinner.push("Keep portions smaller and avoid late-night meals");
    } else if (goal === "muscle") {
      meals.breakfast.push("Add eggs or Greek yogurt for extra protein");
      meals.snacks.push("Consider a protein-rich snack after activity");
    }

    if (activity === "low") {
      meals.snacks.push(
        "If very inactive, limit snack frequency and focus on vegetables"
      );
    } else if (activity === "high") {
      meals.lunch.push(
        "Include a starchy carb (rice, pasta, potatoes) around workouts"
      );
    }

    const newPlan = {
      condition: helperCondition,
      conditionLabel: HELPER_PLAN_LABELS[helperCondition] || helperCondition,
      focus: template.focus,
      avoid: template.avoid,
      goal,
      activity,
      meals,
    };
    setPlan(newPlan);
    setTimeout(() => {
      planRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);

    try {
      const savedPlan = await api.mealPlans.create({
        plan_type: "daily",
        condition: newPlan.conditionLabel,
        goal: newPlan.goal,
        activity: newPlan.activity,
        data: {
          conditionLabel: newPlan.conditionLabel,
          focus: newPlan.focus,
          avoid: newPlan.avoid,
          meals: newPlan.meals,
        },
      });
      setHistory((prev) => [savedPlan, ...prev].slice(0, 5));
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to save meal plan.");
    }
  };

  return (
    <section className="flex flex-1 items-center justify-center">
      <div className="flex w-full max-w-3xl flex-col rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur sm:p-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-emerald-900 sm:text-2xl">
            Food Prescription Helper
          </h2>
          <button
            type="button"
            onClick={() => navigate("/monthly-plan")}
            className="w-full rounded-lg border border-emerald-600 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 sm:w-auto"
          >
            Open Monthly Planner
          </button>
        </div>

        <form
          onSubmit={handleGenerate}
          className="mb-4 grid gap-3 text-sm text-gray-800 sm:grid-cols-3 sm:gap-4"
        >
          <label className="flex flex-col gap-1">
            <span className="font-medium text-gray-700">Quick plan focus</span>
            <select
              value={helperCondition}
              onChange={(event) => setHelperCondition(event.target.value)}
              className="rounded-lg border border-gray-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {Object.entries(HELPER_PLAN_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-medium text-gray-700">Activity level</span>
            <select
              value={activity}
              onChange={(event) => setActivity(event.target.value)}
              className="rounded-lg border border-gray-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-medium text-gray-700">Goal</span>
            <select
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              className="rounded-lg border border-gray-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="balance">Balanced eating</option>
              <option value="weight-loss">Weight loss</option>
              <option value="muscle">Muscle gain</option>
            </select>
          </label>

          <button
            type="submit"
            className="col-span-full mt-1 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Generate simple plan
          </button>
        </form>

        {plan && (
          <div
            ref={planRef}
            className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900"
          >
            <h3 className="mb-1 text-sm font-semibold">
              Condition focus: {plan.conditionLabel}
            </h3>
            <p className="mb-2 text-xs text-emerald-800">{plan.focus}</p>
            <p className="mb-1 text-xs font-semibold text-emerald-900">
              Foods to limit:
            </p>
            <ul className="mb-3 list-disc space-y-1 pl-5 text-xs">
              {plan.avoid.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3 className="mb-2 text-sm font-semibold">Simple daily meal outline</h3>
            <div className="space-y-3">
              <div>
                <p className="font-semibold">Breakfast</p>
                <ul className="list-disc space-y-1 pl-5">
                  {plan.meals.breakfast.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold">Lunch</p>
                <ul className="list-disc space-y-1 pl-5">
                  {plan.meals.lunch.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold">Dinner</p>
                <ul className="list-disc space-y-1 pl-5">
                  {plan.meals.dinner.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold">Snacks</p>
                <ul className="list-disc space-y-1 pl-5">
                  {plan.meals.snacks.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-4 rounded-xl bg-white/90 p-4 text-xs text-gray-700 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-emerald-900">
              Recently generated plans
            </h3>
            <ul className="space-y-1">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    <span className="font-medium capitalize">
                      {(item.goal || "balanced eating").replace("-", " ")}
                    </span>{" "}
                    for{" "}
                    <span className="capitalize">
                      {item.data?.conditionLabel || item.condition}
                    </span>
                  </span>
                  {(item.created_at || item.created) && (
                    <span className="text-[10px] text-gray-500">
                      {new Date(item.created_at || item.created).toLocaleDateString()}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && <p className="mt-3 text-xs font-medium text-red-600">{error}</p>}
      </div>
    </section>
  );
};

export default Prescription;
