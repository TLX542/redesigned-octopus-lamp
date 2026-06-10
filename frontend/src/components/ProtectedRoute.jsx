import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles = [], requireAuth = true, redirectTo = "/" }) {
  const { isLoggedIn, role } = useAuth();
  const location = useLocation();

  if (requireAuth && !isLoggedIn) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;