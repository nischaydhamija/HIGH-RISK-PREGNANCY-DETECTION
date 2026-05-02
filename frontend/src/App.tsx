import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Index from "./pages/Index";
import MaternalGuide from "./pages/MaternalGuide";
import DietPlan from "./pages/DietPlan";
import YogaExercises from "./pages/YogaExercises";
import DosAndDonts from "./pages/DosAndDonts";
import HealthTracking from "./pages/HealthTracking";
import GraphDetail from "./pages/GraphDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const isUserLoggedIn = () => {
  try {
    const userRaw = localStorage.getItem("user");
    if (!userRaw) return false;
    const user = JSON.parse(userRaw);
    return Boolean(user?.user_id);
  } catch {
    return false;
  }
};

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  return isUserLoggedIn() ? children : <Navigate to="/" replace />;
};

const PublicRoute = ({ children }: { children: JSX.Element }) => {
  return isUserLoggedIn() ? <Navigate to="/home" replace /> : children;
};

const AppRoutes = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/" || location.pathname === "/signup";

  return (
    <>
      {!isAuthPage && <Navbar />}
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          }
        />
        <Route
          path="/maternal-guide"
          element={
            <ProtectedRoute>
              <MaternalGuide />
            </ProtectedRoute>
          }
        />
        <Route
          path="/diet-plan"
          element={
            <ProtectedRoute>
              <DietPlan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/yoga"
          element={
            <ProtectedRoute>
              <YogaExercises />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dos-and-donts"
          element={
            <ProtectedRoute>
              <DosAndDonts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/health-tracking"
          element={
            <ProtectedRoute>
              <HealthTracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/graph-detail"
          element={
            <ProtectedRoute>
              <GraphDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <ProtectedRoute>
              <NotFound />
            </ProtectedRoute>
          }
        />
      </Routes>
      {!isAuthPage && <Footer />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;