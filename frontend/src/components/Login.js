import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./Login.module.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // ✅ FIXED: added missing state

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const avatars = {
    user: "https://cdn-icons-png.flaticon.com/512/847/847969.png",
    staff: "https://cdn-icons-png.flaticon.com/512/2922/2922510.png",
    admin: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("⚠️ Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      let endpoint = "/login";
      if (role === "staff") endpoint = "/staff-login";
      else if (role === "admin") endpoint = "/admin-login";

      const res = await axios.post(`${API_URL}${endpoint}`, {
        email,
        password,
      });

      const { token, role: userRole, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", userRole);

      if (rememberMe) localStorage.setItem("rememberedEmail", email);
      else localStorage.removeItem("rememberedEmail");

      if (userRole === "user") {
        localStorage.setItem("userId", user.id);
        localStorage.setItem("userName", user.name);
        navigate("/userdashboard");
      } else if (userRole === "staff") {
        localStorage.setItem("staffId", user.staff_id || user.id);
        localStorage.setItem("staffName", user.name);
        navigate("/staffdashboard");
      } else if (userRole === "admin") {
        localStorage.setItem("adminId", user.id);
        localStorage.setItem("adminName", user.name);
        navigate("/admindashboard");
      }

      toast.success("✅ Login successful!");
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
    <div className={styles.loginPage}>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <div className={styles.container}>
        <div className={styles.avatarWrapper}>
          {/* Optional avatar preview */}
          {/* <img
            src={avatars[role]}
            alt={`${role} avatar`}
            className={styles.avatarImage}
          /> */}
        </div>

        <h2>LOGIN</h2>

        {/* === Role Selection === */}
        <div className={styles.roleSelection}>
          <button
            type="button"
            className={`${styles.roleButton} ${
              role === "user" ? styles.active : ""
            }`}
            onClick={() => setRole("user")}
          >
            <img src={avatars.user} alt="User" />
            <span>User</span>
          </button>

          <button
            type="button"
            className={`${styles.roleButton} ${
              role === "staff" ? styles.active : ""
            }`}
            onClick={() => setRole("staff")}
          >
            <img src={avatars.staff} alt="Staff" />
            <span>Staff</span>
          </button>

          <button
            type="button"
            className={`${styles.roleButton} ${
              role === "admin" ? styles.active : ""
            }`}
            onClick={() => setRole("admin")}
          >
            <img src={avatars.admin} alt="Admin" />
            <span>Admin</span>
          </button>
        </div>

        {/* === Login Form === */}
        <form onSubmit={handleLogin}>
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

          {/* === Password Field with Eye Toggle === */}
          <div className={styles.inputWrapper} style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingRight: "35px" }}
            />
            <label>Password</label>

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {showPassword ? (
                // Hide Icon (Eye Off)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5.5 0-10-4-10-8s4.5-8 10-8c2 0 4 .6 5.5 1.7" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                // Show Icon (Eye)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {/* === Options Row === */}
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

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className={styles.loginRedirect}>
          Don’t have an account?{" "}
          <span onClick={() => navigate("/register")}>Register</span>
        </div>
      </div>
    </div>
  );
}
