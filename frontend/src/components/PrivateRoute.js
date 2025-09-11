import React from "react";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, roles }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" />;

  try {
    // Decode JWT payload
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userRole = payload.role;

    if (roles && !roles.includes(userRole)) {
      return <Navigate to="/login" />;
    }

    return children;
  } catch (err) {
    console.error("Invalid token", err);
    return <Navigate to="/login" />;
  }
}
