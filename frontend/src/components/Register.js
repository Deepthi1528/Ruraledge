import React, { useState, useEffect } from "react";
import { api } from "../api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import styles from "./Register.module.css";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contact, setContact] = useState("");
  const [role, setRole] = useState("");
  const [departments, setDepartments] = useState([]);
  const [wards, setWards] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  const [wardId, setWardId] = useState("");
  const [language, setLanguage] = useState(localStorage.getItem("lang") || "en");
  const [translations, setTranslations] = useState({});
  const [showPassword, setShowPassword] = useState(false); // ✅ Added state

  // === Translation API ===
  useEffect(() => {
    const translateTexts = async () => {
      const keys = [
        "Register",
        "Name",
        "Email",
        "Password",
        "Contact Number",
        "User",
        "Staff",
        "Select Department",
        "Select Ward",
        "Already have an account?",
        "Login here",
      ];
      if (language === "en") {
        const enTranslations = {};
        keys.forEach((k) => (enTranslations[k] = k));
        setTranslations(enTranslations);
        return;
      }
      const newTranslations = {};
      for (let key of keys) {
        try {
          const res = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${language}&dt=t&q=${encodeURIComponent(
              key
            )}`
          );
          const data = await res.json();
          newTranslations[key] = data[0][0][0];
        } catch {
          newTranslations[key] = key;
        }
      }
      setTranslations(newTranslations);
    };
    translateTexts();
  }, [language]);

  // === Fetch Departments & Wards (for staff only) ===
  useEffect(() => {
    if (role === "staff") {
      api
        .get("/departments")
        .then((res) => setDepartments(res.data))
        .catch(() => toast.error("Failed to load departments"));

      api
        .get("/wards")
        .then((res) => setWards(res.data))
        .catch(() => toast.error("Failed to load wards"));
    } else {
      setDepartments([]);
      setWards([]);
      setDepartmentId("");
      setWardId("");
    }
  }, [role]);

  // === Validation ===
  const validateForm = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+=\-{}[\]|:;"'<>,.?/~`]).{8,}$/;

    if (!emailRegex.test(email)) {
      toast.error("Email must be a valid @gmail.com address");
      return false;
    }
    if (!passwordRegex.test(password)) {
      toast.error(
        "Password must contain at least 8 characters, one uppercase letter, one number, and one special character"
      );
      return false;
    }
    if (!role) {
      toast.error("Please select a role");
      return false;
    }
    return true;
  };

  // === Handle Submit ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (role === "user") {
        const res = await api.post("/register", {
          name,
          email,
          password,
          contact_number: contact,
        });
        toast.success(res.data.message);
      } else {
        const res = await api.post("/staff-register", {
          name,
          email,
          password,
          department_id: departmentId,
          assigned_ward_id: wardId,
        });
        toast.success(res.data.message);
      }

      setName("");
      setEmail("");
      setPassword("");
      setContact("");
      setDepartmentId("");
      setWardId("");
      setRole("");

      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className={styles.registerPage}>
      <div className={styles.registerContainer}>
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />

        {/* === Language Switch === */}
        <div style={{ textAlign: "right", marginBottom: "10px" }}>
          <span
            style={{
              cursor: "pointer",
              fontWeight: language === "en" ? "bold" : "normal",
            }}
            onClick={() => setLanguage("en")}
          >
            English
          </span>{" "}
          |{" "}
          <span
            style={{
              cursor: "pointer",
              fontWeight: language === "kn" ? "bold" : "normal",
            }}
            onClick={() => setLanguage("kn")}
          >
            ಕನ್ನಡ
          </span>
        </div>

        <h2>{translations["Register"] || "Register"}</h2>

        {/* === Role Selection === */}
        <p className={styles.roleTitle}>Who are you?</p>
        <div className={styles.roleSelection}>
          <div
            className={`${styles.roleCard} ${
              role === "user" ? styles.active : ""
            }`}
            onClick={() => setRole("user")}
          >
            <div className={styles.roleIconWrapper}>
              <img
                src="https://cdn-icons-png.flaticon.com/512/847/847969.png"
                alt="User Avatar"
                className={styles.roleIcon}
              />
            </div>
            <span>{translations["User"] || "User"}</span>
          </div>

          <div
            className={`${styles.roleCard} ${
              role === "staff" ? styles.active : ""
            }`}
            onClick={() => setRole("staff")}
          >
            <div className={styles.roleIconWrapper}>
              <img
                src="https://cdn-icons-png.flaticon.com/512/2922/2922510.png"
                alt="Staff Avatar"
                className={styles.roleIcon}
              />
            </div>
            <span>{translations["Staff"] || "Staff"}</span>
          </div>
        </div>

        {/* === Form === */}
        <form onSubmit={handleSubmit}>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              placeholder=" "
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <label>{translations["Name"] || "Name"}</label>
          </div>

          <div className={styles.inputWrapper}>
            <input
              type="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>{translations["Email"] || "Email"}</label>
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
            <label>{translations["Password"] || "Password"}</label>

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

          {role === "user" && (
            <div className={styles.inputWrapper}>
              <input
                placeholder=" "
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
              <label>
                {translations["Contact Number"] || "Contact Number"}
              </label>
            </div>
          )}

          {role === "staff" && (
            <>
              <div className={styles.inputWrapper}>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  required
                >
                  <option value="">
                    {translations["Select Department"] || "Select Department"}
                  </option>
                  {departments.map((d) => (
                    <option key={d.department_id} value={d.department_id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <label>
                  {translations["Select Department"] || "Select Department"}
                </label>
              </div>

              <div className={styles.inputWrapper}>
                <select
                  value={wardId}
                  onChange={(e) => setWardId(e.target.value)}
                  required
                >
                  <option value="">
                    {translations["Select Ward"] || "Select Ward"}
                  </option>
                  {wards.map((w) => (
                    <option key={w.ward_id} value={w.ward_id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <label>{translations["Select Ward"] || "Select Ward"}</label>
              </div>
            </>
          )}

          <button type="submit" className={styles.submitBtn}>
            {translations["Register"] || "Register"}
          </button>
        </form>

        {/* === Login Redirect === */}
        <div className={styles.loginRedirect}>
          <p>
            {translations["Already have an account?"] ||
              "Already have an account?"}{" "}
            <span onClick={() => navigate("/login")}>
              {translations["Login here"] || "Login here"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
