import { useEffect, useState } from "react";
import { api } from "../services/api";

const StatCard = ({ label, value }) => (
  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
    <p className="text-xs uppercase tracking-wide text-blue-700">{label}</p>
    <p className="mt-1 text-2xl font-bold text-blue-900">{value}</p>
  </div>
);

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.admin.overview();
        setData(response);
      } catch (err) {
        setError(err?.message || "Unable to load admin dashboard.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section className="flex flex-1 items-center justify-center">
      <div className="flex w-full max-w-5xl flex-col rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur sm:p-8">
        <h2 className="mb-2 text-xl font-semibold text-blue-900 sm:text-2xl">
          Admin Dashboard
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Monitor users and app activity in one place.
        </p>

        {loading && <p className="text-sm text-gray-600">Loading admin overview...</p>}
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        {!loading && !error && data && (
          <>
            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Users" value={data.stats.total_users} />
              <StatCard label="Doctors" value={data.stats.total_doctors} />
              <StatCard label="Food Checks" value={data.stats.total_food_checks} />
              <StatCard label="Meal Plans" value={data.stats.total_meal_plans} />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="mb-2 text-sm font-semibold text-gray-900">Recent Users</h3>
                <ul className="space-y-2 text-xs text-gray-700">
                  {data.recent_users.map((user) => (
                    <li key={user.id} className="rounded bg-gray-50 p-2">
                      <p className="font-medium">{user.full_name || "No name"}</p>
                      <p>{user.email}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="mb-2 text-sm font-semibold text-gray-900">Recent Food Checks</h3>
                <ul className="space-y-2 text-xs text-gray-700">
                  {data.recent_food_checks.map((item) => (
                    <li key={item.id} className="rounded bg-gray-50 p-2">
                      <p className="font-medium">{item.name}</p>
                      <p className="capitalize">{item.status}</p>
                      <p>{item.expiry}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="mb-2 text-sm font-semibold text-gray-900">Recent Meal Plans</h3>
                <ul className="space-y-2 text-xs text-gray-700">
                  {data.recent_meal_plans.map((item) => (
                    <li key={item.id} className="rounded bg-gray-50 p-2">
                      <p className="font-medium">
                        {item.plan_type} - {item.condition}
                      </p>
                      <p>{item.goal || "No goal"}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default AdminDashboard;
