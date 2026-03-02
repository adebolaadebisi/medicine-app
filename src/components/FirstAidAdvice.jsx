import { useEffect, useState } from "react";

const FIRST_AID_MAP = {
  fever: [
    "Drink enough water and rest.",
    "Use a lukewarm sponge bath if temperature is high.",
    "Seek medical care if fever persists for more than 48 hours.",
  ],
  chest: [
    "Stop activity and sit upright.",
    "If severe pain, call emergency services immediately.",
    "Do not delay care if pain spreads to arm, neck, or jaw.",
  ],
  rash: [
    "Wash area gently with mild soap and water.",
    "Avoid scratching and keep skin cool.",
    "Seek care if rash spreads quickly or breathing changes.",
  ],
  default: [
    "Stay calm and monitor symptoms closely.",
    "Avoid self-medicating beyond basic first aid.",
    "Contact a qualified clinician for persistent symptoms.",
  ],
};

export default function FirstAidAdvice({ userCondition }) {
  const [advice, setAdvice] = useState(null);

  useEffect(() => {
    if (!userCondition) {
      setAdvice(null);
      return;
    }

    const input = userCondition.toLowerCase();
    let key = "default";
    if (input.includes("fever")) key = "fever";
    else if (input.includes("chest") || input.includes("heart")) key = "chest";
    else if (input.includes("rash") || input.includes("skin")) key = "rash";

    setAdvice({
      condition: key,
      steps: FIRST_AID_MAP[key],
    });
  }, [userCondition]);

  if (!advice) return <p>No first aid instructions found. See a doctor.</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">
        First Aid Advice for {advice.condition}
      </h2>
      <ol className="list-decimal ml-6">
        {advice.steps.map((step, idx) => (
          <li key={idx}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
