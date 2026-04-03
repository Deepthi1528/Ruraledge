import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Register from "./components/Register";
import Login from "./components/Login";
import UserDashboard from "./components/UserDashboard";
import StaffDashboard from "./components/StaffDashboard";
import AdminDashboard from "./components/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import LanguageSelector from "./components/LanguageSelector";
import "leaflet/dist/leaflet.css";
import "./i18n";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password/:token" element={<ResetPassword />} />
        {/* User Dashboard */}
        <Route
          path="/userdashboard"
          element={
            <ProtectedRoute allow={["user"]}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* Staff Dashboard */}
        <Route
          path="/staffdashboard"
          element={
            <ProtectedRoute allow={["staff"]}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/admindashboard"
          element={
            <ProtectedRoute allow={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
