import React, { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./Login.module.css"; // reuse same styling

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/forgot-password`, { email });
      toast.success("📧 Password reset link sent to your email!");
      setEmail("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Error sending reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <div className={styles.container}>
        <h2>🔑 Forgot Password</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
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
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
}
