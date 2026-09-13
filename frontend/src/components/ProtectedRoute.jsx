import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import Loading from "./Loading.jsx";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, isHydrated } = useAuth();
  const location = useLocation();

  if (!isHydrated || isLoading) {
    return <Loading message="Restoring session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
