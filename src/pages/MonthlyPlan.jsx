import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const MONTHLY_CONDITION_LABELS = {
  none: "None / general health",
  diabetes: "Diabetes",
  hypertension: "High blood pressure",
  cholesterol: "High cholesterol",
  anemia: "Anemia",
  gerd: "Ulcer/Acid reflux (GERD)",
  constipation: "Constipation",
  kidney: "Kidney disease",
  pregnancy: "Pregnancy",
  underweight: "Underweight",
};

const MONTHLY_MEAL_TEMPLATES = {
  none: {
    morning: [
      "Oats, banana, and boiled egg",
      "Whole-grain toast, avocado, and fruit",
      "Yogurt bowl with nuts and berries",
      "Millet porridge with milk and fruit",
    ],
    afternoon: [
      "Grilled chicken, brown rice, and salad",
      "Beans and mixed vegetables with fish",
      "Small eba with okra and lean fish",
      "Small amala with ewedu and turkey",
      "Small semo with vegetable soup and fish",
      "Small pounded yam with okra and fish",
      "Small wheat swallow with ogbono and lean meat",
      "Quinoa bowl with lean protein",
    ],
    night: [
      "Vegetable stir-fry with fish",
      "Light soup with whole-grain bread",
      "Small amala with ewedu and turkey",
      "Small eba with vegetable soup",
      "Small semo with okra and fish",
      "Small wheat swallow with ugu soup",
      "Baked fish and sweet potato",
    ],
    snacks: [
      "Apple and nuts",
      "Plain yogurt and seeds",
      "Carrot sticks and hummus",
      "Pear and peanuts",
    ],
  },
  diabetes: {
    morning: [
      "Plain oats, chia seeds, and berries",
      "Eggs with sauteed vegetables",
      "Unsweetened yogurt and nuts",
      "Whole-grain toast with avocado",
    ],
    afternoon: [
      "Grilled fish, salad, and small brown rice",
      "Beans with vegetables and lean protein",
      "Chicken and steamed vegetables",
      "Small semo with okra and lean meat",
      "Small wheat swallow with vegetable soup",
      "Small eba with okra and fish",
      "Small oat swallow with greens and fish",
    ],
    night: [
      "Vegetable soup with fish",
      "Stir-fried vegetables with tofu (Awara / Soy wara) or chicken",
      "Baked chicken and greens",
      "Light bean stew and salad",
    ],
    snacks: [
      "Unsweetened yogurt",
      "Nuts and cucumber slices",
      "Small apple with peanut butter",
      "Boiled egg and tomato slices",
    ],
  },
  hypertension: {
    morning: [
      "Banana oats with low-fat milk",
      "Whole-grain bread, avocado, and fruit",
      "Yogurt and unsalted nuts",
      "Boiled yam with vegetable sauce (low salt)",
    ],
    afternoon: [
      "Grilled fish, vegetables, and brown rice",
      "Beans and salad with olive oil",
      "Small eba with low-salt vegetable soup",
      "Small amala with ewedu and fish (minimal salt)",
      "Small wheat swallow with low-salt okra",
      "Lentil soup and whole-grain bread",
    ],
    night: [
      "Steamed vegetables and fish",
      "Light soup with lean protein",
      "Small amala with ewedu and fish (minimal salt)",
      "Small semo with low-salt vegetable soup",
      "Small eba with okra and fish (minimal salt)",
      "Sauteed vegetables with quinoa",
    ],
    snacks: [
      "Unsalted nuts",
      "Watermelon slices",
      "Pear and plain yogurt",
      "Banana and seeds",
    ],
  },
  cholesterol: {
    morning: [
      "Oats with flaxseed and berries",
      "Whole-grain toast with avocado",
      "Fruit and unsweetened yogurt",
      "Chia pudding with nuts",
    ],
    afternoon: [
      "Grilled chicken salad with olive oil",
      "Beans and whole grain with vegetables",
      "Small wheat swallow with okra and fish",
      "Small oat swallow with vegetable soup",
      "Small eba with light okra and fish",
      "Lentils and mixed greens",
    ],
    night: [
      "Vegetable soup with fish",
      "Stir-fried vegetables and tofu (Awara / Soy wara)",
      "Steamed fish with greens",
      "Small oat swallow with vegetable soup",
      "Small semo with ugu and fish",
    ],
    snacks: [
      "Almonds and apple",
      "Walnuts and pear",
      "Carrot sticks and hummus",
      "Yogurt with seeds",
    ],
  },
  anemia: {
    morning: [
      "Fortified cereal with orange slices",
      "Eggs and spinach with toast",
      "Oats with pumpkin seeds",
      "Bean cake and fruit rich in vitamin C",
    ],
    afternoon: [
      "Lean beef/chicken, beans, and greens",
      "Lentils, spinach, and brown rice",
      "Fish stew with leafy vegetables",
      "Small pounded yam with ugu soup and fish",
      "Small amala with efo riro and lean meat",
      "Small semo with vegetable soup and fish",
    ],
    night: [
      "Chicken and vegetable soup",
      "Fish with steamed greens",
      "Small semo with efo riro and lean meat",
      "Small eba with ugu soup and fish",
      "Small wheat swallow with spinach soup",
      "Light iron-rich salad and eggs",
    ],
    snacks: [
      "Dried apricots and nuts",
      "Orange and peanuts",
      "Yogurt and seeds",
      "Boiled egg and fruit",
    ],
  },
  gerd: {
    morning: [
      "Oats and banana",
      "Low-fat yogurt with oats",
      "Whole-grain toast and boiled egg",
      "Pap (not spicy) with milk",
    ],
    afternoon: [
      "Mild grilled chicken and rice",
      "Steamed fish with vegetables",
      "Turkey sandwich (low spice)",
      "Small soft semo with mild okra soup",
      "Small wheat swallow with mild vegetable soup",
    ],
    night: [
      "Light vegetable soup",
      "Baked fish and soft veggies",
      "Small quinoa and chicken plate",
      "Steamed vegetables with tofu (Awara / Soy wara)",
    ],
    snacks: ["Banana", "Plain crackers and yogurt", "Pear slices", "Oat biscuits (low fat)"],
  },
  constipation: {
    morning: [
      "High-fiber oats with chia",
      "Whole-grain toast and fruit",
      "Yogurt with prunes",
      "Millet porridge and berries",
    ],
    afternoon: [
      "Beans, vegetables, and brown rice",
      "Lentil soup with whole-grain bread",
      "Chicken and high-fiber salad",
      "Quinoa and mixed vegetables",
    ],
    night: [
      "Vegetable soup and beans",
      "Steamed greens with fish",
      "Light whole-grain pasta and vegetables",
      "Small oat swallow with okra and vegetable soup",
      "Small wheat swallow with high-fiber vegetable soup",
    ],
    snacks: ["Prunes and water", "Apple with skin and nuts", "Carrot and cucumber sticks", "Pear and yogurt"],
  },
  kidney: {
    morning: [
      "Low-salt porridge and fruit",
      "Toast and boiled egg (portion-controlled)",
      "Oats with berries",
      "Yogurt and low-salt crackers",
    ],
    afternoon: [
      "Moderate protein and vegetable plate",
      "Rice and cooked vegetables (low salt)",
      "Small semo with low-salt okra soup",
      "Small wheat swallow with low-salt vegetable soup",
      "Fish and controlled grain portion",
    ],
    night: [
      "Vegetable soup (low sodium)",
      "Steamed veggies and fish",
      "Light grain and lean protein",
      "Boiled potatoes and vegetable mix",
    ],
    snacks: ["Apple slices", "Unsalted popcorn", "Small yogurt", "Crackers and cucumber"],
  },
  pregnancy: {
    morning: [
      "Whole-grain toast, egg, and fruit",
      "Oats with milk and banana",
      "Yogurt parfait with nuts",
      "Fortified cereal and berries",
    ],
    afternoon: [
      "Chicken, vegetables, and brown rice",
      "Beans and fish with salad",
      "Small eba with vegetable soup and fish",
      "Small amala with ewedu and fish",
      "Small semo with mild vegetable soup",
      "Turkey wrap and vegetable soup",
    ],
    night: [
      "Steamed fish and vegetables",
      "Lean meat with sweet potato",
      "Vegetable soup and whole-grain bread",
      "Tofu (Awara / Soy wara) or chicken stir-fry",
    ],
    snacks: ["Fruit and yogurt", "Nuts and crackers", "Wara (local cheese) and apple slices", "Smoothie with milk and banana"],
  },
  underweight: {
    morning: [
      "Oats, milk, banana, and peanut butter",
      "Egg sandwich and smoothie",
      "Yogurt bowl with granola and nuts",
      "Whole-grain pancakes and fruit",
    ],
    afternoon: [
      "Rice, chicken, vegetables, and olive oil",
      "Beans and fish with avocado",
      "Pasta with lean meat and salad",
      "Moderate pounded yam with egusi and fish",
      "Moderate eba with vegetable soup and fish",
      "Moderate amala with ewedu and protein",
    ],
    night: [
      "Sweet potato and fish",
      "Chicken stew and whole grains",
      "Vegetable soup with bread and eggs",
      "Amala with ewedu and assorted lean protein",
      "Moderate semo with okra and fish",
      "Moderate wheat swallow with vegetable soup",
    ],
    snacks: ["Nuts and dried fruit", "Yogurt smoothie", "Peanut butter toast", "Wara (local cheese) and crackers"],
  },
};

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const isSwallowMeal = (meal = "") => {
  const normalized = meal.toLowerCase();
  return (
    normalized.includes(" eba") ||
    normalized.startsWith("eba") ||
    normalized.includes("amala") ||
    normalized.includes("semo") ||
    normalized.includes("pounded yam") ||
    normalized.includes("wheat swallow") ||
    normalized.includes("oat swallow")
  );
};

const pickNonRepeatingMeal = (
  items,
  dayIndex,
  weekIndex,
  previousMeal,
  offset = 0
) => {
  if (!items?.length) return "Not set";
  const baseIndex = (dayIndex + weekIndex + offset) % items.length;
  let meal = items[baseIndex];
  if (items.length === 1) return meal;

  if (meal === previousMeal) {
    for (let i = 1; i < items.length; i += 1) {
      const candidate = items[(baseIndex + i) % items.length];
      if (candidate !== previousMeal) {
        meal = candidate;
        break;
      }
    }
  }
  return meal;
};

const pickNightMealWithoutSwallowClash = (
  nightItems,
  afternoonMeal,
  previousNightMeal,
  dayIndex,
  weekIndex
) => {
  if (!nightItems?.length) return "Not set";
  const baseIndex = (dayIndex + weekIndex + 2) % nightItems.length;
  let fallbackNoRepeat = nightItems[baseIndex];
  let fallbackNoSwallowClash = nightItems[baseIndex];

  for (let i = 0; i < nightItems.length; i += 1) {
    const candidate = nightItems[(baseIndex + i) % nightItems.length];
    const hasSwallowClash =
      isSwallowMeal(candidate) && isSwallowMeal(afternoonMeal);
    const isRepeat = candidate === previousNightMeal;

    if (!isRepeat && !hasSwallowClash) return candidate;
    if (!isRepeat && fallbackNoRepeat === nightItems[baseIndex]) fallbackNoRepeat = candidate;
    if (!hasSwallowClash && fallbackNoSwallowClash === nightItems[baseIndex]) fallbackNoSwallowClash = candidate;
  }
  if (fallbackNoRepeat !== nightItems[baseIndex]) return fallbackNoRepeat;
  if (fallbackNoSwallowClash !== nightItems[baseIndex]) return fallbackNoSwallowClash;
  return nightItems[baseIndex];
};

const buildMonthlyPlan = (template) => {
  const monthlyPlan = [];
  let prevMorning = "";
  let prevAfternoon = "";
  let prevNight = "";
  let prevSnacks = "";

  for (let weekIndex = 0; weekIndex < 4; weekIndex += 1) {
    const week = { weekLabel: `Week ${weekIndex + 1}`, days: [] };
    for (let dayIndex = 0; dayIndex < DAYS_OF_WEEK.length; dayIndex += 1) {
      const day = DAYS_OF_WEEK[dayIndex];
      const morningMeal = pickNonRepeatingMeal(
        template.morning,
        dayIndex,
        weekIndex,
        prevMorning
      );
      const afternoonMeal = pickNonRepeatingMeal(
        template.afternoon,
        dayIndex,
        weekIndex,
        prevAfternoon,
        1
      );
      const nightMeal = pickNightMealWithoutSwallowClash(
        template.night,
        afternoonMeal,
        prevNight,
        dayIndex,
        weekIndex
      );
      const snackMeal = pickNonRepeatingMeal(
        template.snacks,
        dayIndex,
        weekIndex,
        prevSnacks,
        3
      );

      week.days.push({
        day,
        morning: morningMeal,
        afternoon: afternoonMeal,
        night: nightMeal,
        snacks: snackMeal,
      });

      prevMorning = morningMeal;
      prevAfternoon = afternoonMeal;
      prevNight = nightMeal;
      prevSnacks = snackMeal;
    }
    monthlyPlan.push(week);
  }

  return monthlyPlan;
};

const MonthlyPlan = () => {
  const [monthlyCondition, setMonthlyCondition] = useState("none");
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const monthlyTemplate =
    MONTHLY_MEAL_TEMPLATES[monthlyCondition] || MONTHLY_MEAL_TEMPLATES.none;
  const monthlyPlan = useMemo(
    () => buildMonthlyPlan(monthlyTemplate),
    [monthlyTemplate]
  );

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const rows = await api.mealPlans.list({ plan_type: "monthly", limit: 5 });
        setHistory(rows);
      } catch (err) {
        setError(err?.message || "Failed to load monthly plan history.");
      }
    };
    loadHistory();
  }, []);

  const handleSaveMonthlyPlan = async () => {
    setSaving(true);
    try {
      const saved = await api.mealPlans.create({
        plan_type: "monthly",
        condition: MONTHLY_CONDITION_LABELS[monthlyCondition],
        data: {
          conditionKey: monthlyCondition,
          conditionLabel: MONTHLY_CONDITION_LABELS[monthlyCondition],
          weeks: monthlyPlan,
        },
      });
      setHistory((prev) => [saved, ...prev].slice(0, 5));
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to save monthly plan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="flex flex-1 items-center justify-center">
      <div className="flex w-full max-w-5xl flex-col rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur sm:p-8">
        <h2 className="mb-2 text-xl font-semibold text-emerald-900 sm:text-2xl">
          Monthly Meal Planner
        </h2>
        <p className="mb-3 text-xs text-emerald-800">
          4-week plan with all 7 days. Meals rotate, can repeat reasonably, and
          avoid same-day swallow clash between afternoon and night.
        </p>
        <label className="mb-4 flex flex-col gap-1 text-sm">
          <span className="font-medium text-emerald-900">
            Condition for monthly plan
          </span>
          <select
            value={monthlyCondition}
            onChange={(event) => setMonthlyCondition(event.target.value)}
            className="max-w-sm rounded-lg border border-emerald-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {Object.entries(MONTHLY_CONDITION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={handleSaveMonthlyPlan}
          disabled={saving}
          className="mb-4 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {saving ? "Saving..." : "Save This Monthly Plan"}
        </button>

        <div className="space-y-4">
          {monthlyPlan.map((week) => (
            <div
              key={week.weekLabel}
              className="rounded-lg border border-emerald-200 bg-white"
            >
              <p className="border-b border-emerald-200 bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-900">
                {week.weekLabel}
              </p>

              <div className="space-y-2 p-2 md:hidden">
                {week.days.map((row) => (
                  <div
                    key={row.day}
                    className="rounded-md border border-emerald-100 p-2 text-xs"
                  >
                    <p className="mb-1 font-semibold text-emerald-900">{row.day}</p>
                    <p><span className="font-semibold">Morning:</span> {row.morning}</p>
                    <p><span className="font-semibold">Afternoon:</span> {row.afternoon}</p>
                    <p><span className="font-semibold">Night:</span> {row.night}</p>
                    <p><span className="font-semibold">Snacks:</span> {row.snacks}</p>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full table-fixed border-collapse text-left text-xs">
                  <thead>
                    <tr className="text-emerald-900">
                      <th className="w-20 p-2">Day</th>
                      <th className="p-2">Morning</th>
                      <th className="p-2">Afternoon</th>
                      <th className="p-2">Night</th>
                      <th className="p-2">Snacks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {week.days.map((row) => (
                      <tr key={row.day} className="border-t border-emerald-100">
                        <td className="p-2 font-semibold">{row.day}</td>
                        <td className="p-2 align-top">{row.morning}</td>
                        <td className="p-2 align-top">{row.afternoon}</td>
                        <td className="p-2 align-top">{row.night}</td>
                        <td className="p-2 align-top">{row.snacks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {history.length > 0 && (
          <div className="mt-4 rounded-xl bg-white/90 p-4 text-xs text-gray-700 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-emerald-900">
              Recently saved monthly plans
            </h3>
            <ul className="space-y-1">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    {item.data?.conditionLabel || item.condition}
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

export default MonthlyPlan;
