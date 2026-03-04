import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import LandingPage from "./components/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Diagnosis from "./pages/Diagnosis";
import DoctorRecommendation from "./pages/DoctorRecommendation";
import FoodCheck from "./pages/FoodCheck";
import Prescription from "./pages/Prescription";
import MonthlyPlan from "./pages/MonthlyPlan";
import VideoConsultation from "./pages/VideoConsultation";
import AdminDashboard from "./pages/AdminDashboard";
import MedicationReminders from "./pages/MedicationReminders";
import Timeline from "./pages/Timeline";
import MyAppointments from "./pages/MyAppointments";
import Notifications from "./pages/Notifications";
import Vitals from "./pages/Vitals";
import CaregiverHub from "./pages/CaregiverHub";
import { useAuth } from "./hooks/useAuth";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="mt-10 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="mt-10 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200">
        <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <LandingPage />
              </Layout>
            }
          />

          <Route
            path="/login"
            element={
              <Layout>
                <Login />
              </Layout>
            }
          />
          <Route
            path="/admin-login"
            element={
              <Layout>
                <Login adminMode />
              </Layout>
            }
          />
          <Route
            path="/register"
            element={
              <Layout>
                <Register />
              </Layout>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/diagnosis"
            element={
              <ProtectedRoute>
                <Layout>
                  <Diagnosis />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctors"
            element={
              <ProtectedRoute>
                <Layout>
                  <DoctorRecommendation />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/food-check"
            element={
              <ProtectedRoute>
                <Layout>
                  <FoodCheck />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/prescription"
            element={
              <ProtectedRoute>
                <Layout>
                  <Prescription />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/monthly-plan"
            element={
              <ProtectedRoute>
                <Layout>
                  <MonthlyPlan />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/video-consultation"
            element={
              <ProtectedRoute>
                <Layout>
                  <VideoConsultation />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/medication-reminders"
            element={
              <ProtectedRoute>
                <Layout>
                  <MedicationReminders />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/timeline"
            element={
              <ProtectedRoute>
                <Layout>
                  <Timeline />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <Layout>
                  <MyAppointments />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Layout>
                  <Notifications />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vitals"
            element={
              <ProtectedRoute>
                <Layout>
                  <Vitals />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/caregiver"
            element={
              <ProtectedRoute>
                <Layout>
                  <CaregiverHub />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
