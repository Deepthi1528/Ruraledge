import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("⚠️ Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      let endpoint = "/login";
      if (role === "staff") endpoint = "/staff-login";
      if (role === "admin") endpoint = "/admin-login";

      // ✅ API call
      const res = await axios.post(`${API_URL}${endpoint}`, { email, password });

      const { token, role: userRole, user } = res.data;

      // ✅ Save token & role
      localStorage.setItem("token", token);
      localStorage.setItem("role", userRole);

      // ✅ Save user-specific data
      if (userRole === "user") {
        localStorage.setItem("userId", user.id);
        localStorage.setItem("userName", user.name);
      } else if (userRole === "staff") {
        localStorage.setItem("staffId", user.staff_id || user.id); // ✅ Fix here
        localStorage.setItem("staffName", user.name);
      } else if (userRole === "admin") {
        localStorage.setItem("adminId", user.id);
        localStorage.setItem("adminName", user.name);
      }

      toast.success("✅ Login successful!");

      // ✅ Navigate based on role
      setTimeout(() => {
        if (userRole === "user") navigate("/userdashboard");
        else if (userRole === "staff") navigate("/staffdashboard");
        else if (userRole === "admin") navigate("/admindashboard");
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.error ||
          (role === "staff"
            ? "Staff not approved yet"
            : "Invalid credentials")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <h2>🔐 Login</h2>

      {/* Role Selection */}
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="role-select"
      >
        <option value="user">User</option>
        <option value="staff">Staff</option>
        <option value="admin">Admin</option>
      </select>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
