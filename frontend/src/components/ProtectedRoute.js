import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const userRole = localStorage.getItem("role");

  if (!isLoggedIn) {
    // Not logged in → redirect to login
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Logged in but wrong role → redirect to home (or login)
    return <Navigate to="/login" />;
  }

  return children;
}

export default ProtectedRoute;