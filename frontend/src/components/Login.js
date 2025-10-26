import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./Login.module.css"; // ✅ Import CSS module

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("user");
  const [rememberMe, setRememberMe] = useState(false);
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

      const res = await axios.post(`${API_URL}${endpoint}`, { email, password });
      const { token, role: userRole, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", userRole);

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      if (userRole === "user") {
        localStorage.setItem("userId", user.id);
        localStorage.setItem("userName", user.name);
      } else if (userRole === "staff") {
        localStorage.setItem("staffId", user.staff_id || user.id);
        localStorage.setItem("staffName", user.name);
      } else if (userRole === "admin") {
        localStorage.setItem("adminId", user.id);
        localStorage.setItem("adminName", user.name);
      }

      toast.success("✅ Login successful!");
      setTimeout(() => {
        if (userRole === "user") navigate("/userdashboard");
        else if (userRole === "staff") navigate("/staffdashboard");
        else if (userRole === "admin") navigate("/admindashboard");
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.error ||
          (role === "staff" ? "Staff not approved yet" : "Invalid credentials")
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Auto-fill email if remembered
  React.useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className={styles.loginPage}>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <div className={styles.container}>
        <h2>🔐 Login</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Email */}
          <div className={styles.inputWrapper}>
            <input
              type="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>Email</label>
          </div>

          {/* Password with Toggle */}
          <div className={`${styles.inputWrapper} ${styles.passwordWrapper}`}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label>Password</label>
            <button
              type="button"
              className={styles.showHideBtn}
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Role Selector */}
          <div className={styles.inputWrapper}>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">Select Role</option>
              <option value="user">User</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            <label>Role</label>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className={styles.optionsRow}>
            <label className={styles.rememberMe}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember Me</span>
            </label>
            <a href="/forgot-password" className={styles.forgotLink}>
              Forgot Password?
            </a>
          </div>

          {/* Submit Button */}
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
