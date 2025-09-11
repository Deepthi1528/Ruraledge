import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, allow }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const location = useLocation();

  // ✅ If user is not logged in → redirect to login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ If role is not allowed → redirect to login
  if (allow && !allow.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  // ✅ If everything is okay → render child component
  return children;
}
