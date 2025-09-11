import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./Register.module.css";

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contact, setContact] = useState('');
  const [role, setRole] = useState('user');
  const [departments, setDepartments] = useState([]);
  const [wards, setWards] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [wardId, setWardId] = useState('');
  const [language, setLanguage] = useState(localStorage.getItem("lang") || "en");

  // ✅ Function to translate page dynamically using Google Translate API
  const translatePage = async (lang) => {
    setLanguage(lang);
    localStorage.setItem("lang", lang);

    const elements = document.querySelectorAll("[data-translate]");
    elements.forEach((el) => {
      const originalText = el.getAttribute("data-translate");
      if (lang === "en") {
        el.innerText = originalText;
      } else {
        fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURIComponent(
            originalText
          )}`
        )
          .then((res) => res.json())
          .then((data) => {
            el.innerText = data[0][0][0];
          })
          .catch(() => {
            el.innerText = originalText;
          });
      }
    });
  };

  // ✅ Auto-translate on page load
  useEffect(() => {
    translatePage(language);
  }, [language]);

  // Fetch departments and wards when role is staff
  useEffect(() => {
    if (role === 'staff') {
      api.get('/departments')
        .then(res => setDepartments(res.data))
        .catch(err => toast.error("Failed to load departments"));

      api.get('/wards')
        .then(res => setWards(res.data))
        .catch(err => toast.error("Failed to load wards"));
    } else {
      // Clear when role changes back to user
      setDepartments([]);
      setWards([]);
      setDepartmentId('');
      setWardId('');
    }
  }, [role]);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (role === 'user') {
        const res = await api.post('/register', {
          name,
          email,
          password,
          contact_number: contact
        });
        toast.success(res.data.message);
      } else {
        const res = await api.post('/staff-register', {
          name,
          email,
          password,
          department_id: departmentId,
          assigned_ward_id: wardId
        });
        toast.success(res.data.message);
      }

      // Clear form
      setName('');
      setEmail('');
      setPassword('');
      setContact('');
      setDepartmentId('');
      setWardId('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  return (

         <div className="register-container">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      {/* ✅ Language Switcher */}
      <div style={{ textAlign: "right", marginBottom: "10px" }}>
        <span
          style={{ cursor: "pointer", fontWeight: language === "en" ? "bold" : "normal" }}
          onClick={() => translatePage("en")}
        >
          English
        </span>{" "}
        |{" "}
        <span
          style={{ cursor: "pointer", fontWeight: language === "kn" ? "bold" : "normal" }}
          onClick={() => translatePage("kn")}
        >
          ಕನ್ನಡ
        </span>
      </div>

      <h2 data-translate="Register">Register</h2>
      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="user"data-translate="User">User</option>
        <option value="staff" data-translate="Staff">Staff</option>
      </select>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Name"
          data-translate="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          placeholder="Email"
          data-translate="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          placeholder="Password"
          data-translate="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {role === 'user' && (
          <input
            placeholder="Contact Number"
            data-translate="Contact Number"
            value={contact}
            onChange={e => setContact(e.target.value)}

          />
        )}
        {role === 'staff' && (
          <>
            <select
              value={departmentId}
              onChange={e => setDepartmentId(e.target.value)}
              required
              data-translate="Select Department"
            >
              <option value=""data-translate="Select Department">Select Department</option>
              {departments.map(d => (
                <option key={d.department_id} value={d.department_id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              value={wardId}
              onChange={e => setWardId(e.target.value)}
              required
              data-translate="Select Ward"
            >
              <option value=""data-translate="Select Ward">Select Ward</option>
              {wards.map(w => (
                <option key={w.ward_id} value={w.ward_id}>
                  {w.name}
                </option>
              ))}
            </select>
          </>
        )}
        <button type="submit"data-translate="Register">Register</button>
      </form>
    </div>
  );
}
