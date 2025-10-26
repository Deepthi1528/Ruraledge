import React, { useState, useEffect } from "react";
import { api } from "../api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./Register.module.css";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contact, setContact] = useState("");
  const [role, setRole] = useState("user");
  const [departments, setDepartments] = useState([]);
  const [wards, setWards] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  const [wardId, setWardId] = useState("");
  const [language, setLanguage] = useState(localStorage.getItem("lang") || "en");
  const [translations, setTranslations] = useState({});

  // Translate page dynamically using Google Translate API
  useEffect(() => {
    const translateTexts = async () => {
      const keys = [
        "Register", "Name", "Email", "Password", "Contact Number",
        "User", "Staff", "Select Department", "Select Ward", "Role"
      ];
      if (language === "en") {
        const enTranslations = {};
        keys.forEach(k => enTranslations[k] = k);
        setTranslations(enTranslations);
        return;
      }
      const newTranslations = {};
      for (let key of keys) {
        try {
          const res = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${language}&dt=t&q=${encodeURIComponent(key)}`
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

  // Fetch departments and wards when role is staff
  useEffect(() => {
    if (role === "staff") {
      api.get("/departments")
        .then(res => setDepartments(res.data))
        .catch(() => toast.error("Failed to load departments"));

      api.get("/wards")
        .then(res => setWards(res.data))
        .catch(() => toast.error("Failed to load wards"));
    } else {
      setDepartments([]);
      setWards([]);
      setDepartmentId("");
      setWardId("");
    }
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (role === "user") {
        const res = await api.post("/register", {
          name,
          email,
          password,
          contact_number: contact
        });
        toast.success(res.data.message);
      } else {
        const res = await api.post("/staff-register", {
          name,
          email,
          password,
          department_id: departmentId,
          assigned_ward_id: wardId
        });
        toast.success(res.data.message);
      }
      // Clear form
      setName("");
      setEmail("");
      setPassword("");
      setContact("");
      setDepartmentId("");
      setWardId("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className={styles.registerPage}>
    <div className={styles.registerContainer}>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      {/* Language Switcher */}
      <div style={{ textAlign: "right", marginBottom: "10px" }}>
        <span
          style={{ cursor: "pointer", fontWeight: language === "en" ? "bold" : "normal" }}
          onClick={() => setLanguage("en")}
        >
          English
        </span>{" "}
        |{" "}
        <span
          style={{ cursor: "pointer", fontWeight: language === "kn" ? "bold" : "normal" }}
          onClick={() => setLanguage("kn")}
        >
          ಕನ್ನಡ
        </span>
      </div>

      <h2>{translations["Register"] || "Register"}</h2>

      <div className={styles.inputWrapper}>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        >
          <option value="">{translations["Role"] || "Role"}</option>
          <option value="user">{translations["User"] || "User"}</option>
          <option value="staff">{translations["Staff"] || "Staff"}</option>
        </select>
        <label>{translations["Role"] || "Role"}</label>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.inputWrapper}>
          <input
          type="Name"
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

        <div className={styles.inputWrapper}>
          <input
            type="password"
            placeholder=" "
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label>{translations["Password"] || "Password"}</label>
        </div>

        {role === "user" && (
          <div className={styles.inputWrapper}>
            <input
              placeholder=" "
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
            <label>{translations["Contact Number"] || "Contact Number"}</label>
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
                <option value="">{translations["Select Department"] || "Select Department"}</option>
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <label>{translations["Select Department"] || "Select Department"}</label>
            </div>

            <div className={styles.inputWrapper}>
              <select
                value={wardId}
                onChange={(e) => setWardId(e.target.value)}
                required
              >
                <option value="">{translations["Select Ward"] || "Select Ward"}</option>
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

        <button type="submit">{translations["Register"] || "Register"}</button>
      </form>
    </div>
    </div>
  );
}
