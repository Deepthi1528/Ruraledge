import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { toast, ToastContainer } from "react-toastify";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePassword = (p) => /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(p);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) return toast.error("Fill all fields");
    if (!validatePassword(password)) return toast.error("Password must be 6+ chars, letters & numbers");
    if (password !== confirmPassword) return toast.error("Passwords do not match");

    setLoading(true);
    try {
      await api.post(`/reset-password/${token}`, { password });
      toast.success("Password reset successful");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <div className="password-wrapper">
          <input
            type={show ? "text" : "password"}
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span onClick={() => setShow(!show)}>
            {show ? <AiFillEyeInvisible /> : <AiFillEye />}
          </span>
        </div>
        <div className="password-wrapper">
          <input
            type={show ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <span onClick={() => setShow(!show)}>
            {show ? <AiFillEyeInvisible /> : <AiFillEye />}
          </span>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
