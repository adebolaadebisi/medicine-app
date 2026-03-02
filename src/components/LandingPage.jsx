import { useNavigate } from "react-router-dom";

const featureCards = [
  {
    title: "Symptom Analysis",
    text: "Check possible causes quickly and get practical next steps before deciding on consultation.",
    image: "/Doctor.jpg",
  },
  {
    title: "Food Prescription",
    text: "Generate condition-aware meal guidance for diabetes, blood pressure, GERD, pregnancy, and more.",
    image: "/wellness picture.jpg",
  },
  {
    title: "Doctor Access",
    text: "Find matching doctors and move to secure video consultation only when you choose to.",
    image: "/OIP.jpg",
  },
];

const quickStats = [
  { label: "Conditions Covered", value: "10+" },
  { label: "Guided Features", value: "5" },
  { label: "Anytime Access", value: "24/7" },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-slate-100 shadow-2xl">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-48 h-72 w-72 rounded-full bg-sky-500/30 blur-3xl" />

      <section className="relative border-b border-white/10 px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-200">
              AI Health Advisory
            </p>
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Smarter first guidance for everyday health decisions
            </h1>
            <p className="mt-4 max-w-xl text-sm text-slate-300 sm:text-base">
              Describe symptoms, receive practical advice, review red flags, and
              connect with a doctor only when you are ready.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                onClick={() => navigate("/register")}
                className="w-full rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 sm:w-auto"
              >
                Create Free Account
              </button>
              <button
                onClick={() => navigate("/login")}
                className="w-full rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 sm:w-auto"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/diagnosis")}
                className="w-full rounded-xl border border-sky-300/40 bg-sky-400/10 px-5 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/20 sm:w-auto"
              >
                Start Diagnosis
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
            <img
              src="/stux-meal-191902_1920.jpg"
              alt="Healthy meal planning"
              className="h-64 w-full rounded-xl object-cover sm:h-72"
            />
          </div>
        </div>
      </section>

      <section className="relative px-6 py-8 sm:px-10 lg:px-14">
        <div className="grid gap-3 sm:grid-cols-3">
          {quickStats.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm"
            >
              <p className="text-2xl font-bold text-emerald-300">{item.value}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-slate-300">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative border-t border-white/10 px-6 py-12 sm:px-10 lg:px-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Core Features
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
              Built for practical care, not noise
            </h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {featureCards.map((card) => (
            <article
              key={card.title}
              className="group rounded-2xl border border-white/10 bg-slate-900/80 p-4 transition hover:-translate-y-1 hover:border-emerald-300/50"
            >
              <img
                src={card.image}
                alt={card.title}
                className="h-36 w-full rounded-xl object-cover"
              />
              <h3 className="mt-4 text-lg font-semibold text-white">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-slate-300">{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative border-t border-white/10 px-6 py-12 text-center sm:px-10 lg:px-14">
        <h3 className="text-2xl font-bold text-white sm:text-3xl">
          Ready to take control of your health journey?
        </h3>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300">
          Start with symptom guidance, follow clear recommendations, and consult
          professionals when needed.
        </p>
        <button
          onClick={() => navigate("/register")}
          className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
        >
          Get Started Now
        </button>
      </section>
    </div>
  );
}
