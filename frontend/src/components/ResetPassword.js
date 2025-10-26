import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./Login.module.css"; // reuse same styling

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function ResetPassword() {
  const { token } = useParams(); // 🔑 get token from URL
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/reset-password/${token}`, {
        newPassword: password,
      });
      toast.success("✅ Password reset successful!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Invalid or expired link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <div className={styles.container}>
        <h2>🔑 Reset Password</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputWrapper}>
            <input
              type="password"
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label>New Password</label>
          </div>

          <div className={styles.inputWrapper}>
            <input
              type="password"
              placeholder=" "
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <label>Confirm Password</label>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
