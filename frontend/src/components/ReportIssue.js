import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ReportIssue.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function ReportIssue({ language }) {
  const navigate = useNavigate();

  const translations = {
    en: {
      title: "Report an Issue",
      department: "-- Select Department --",
      issueType: "Issue Type",
      description: "Describe the issue",
      location: "Location",
      email: "Enter your email",
      phone: "Enter your phone number",
      date: "When did this happen?",
      photo: "Attach a Photo (optional)",
      submit: "Submit Complaint",
      confirm: "Confirm Complaint",
      goBack: "Go Back",
      confirmSubmit: "Confirm & Submit",
    },
    kn: {
      title: "ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ",
      department: "-- ಇಲಾಖೆ ಆಯ್ಕೆಮಾಡಿ --",
      issueType: "ಸಮಸ್ಯೆಯ ಪ್ರಕಾರ",
      description: "ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ",
      location: "ಸ್ಥಳ",
      email: "ನಿಮ್ಮ ಇಮೇಲ್ ನಮೂದಿಸಿ",
      phone: "ನಿಮ್ಮ ಫೋನ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ",
      date: "ಇದು ಯಾವಾಗ ಸಂಭವಿಸಿತು?",
      photo: "ಫೋಟೋ ಅಟ್ಯಾಚ್ ಮಾಡಿ (ಐಚ್ಛಿಕ)",
      submit: "ದೂರು ಸಲ್ಲಿಸಿ",
      confirm: "ದೂರು ದೃಢೀಕರಿಸಿ",
      goBack: "ಹಿಂದಿರುಗಿ",
      confirmSubmit: "ದೃಢೀಕರಿಸಿ ಮತ್ತು ಸಲ್ಲಿಸಿ",
    },
  };

  const t = translations[language];

  const [formData, setFormData] = useState({
    department_id: "",
    issue_type: "",
    description: "",
    location: "",
    preferred_contact_method: "",
    occurred_on: "",
    email: "",
    phone_number: "",
  });

  const [departments, setDepartments] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // ✅ Check authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "user") {
      toast.warning("⚠️ Please login first");
      navigate("/login");
    }
  }, [navigate]);

  // ✅ Fetch departments
  useEffect(() => {
    axios
      .get(`${API_URL}/departments`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setDepartments(res.data);
        } else {
          setDepartments([]);
          toast.error("Invalid department data received");
        }
      })
      .catch(() => toast.error("Failed to fetch departments"));
  }, []);

  // ✅ Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ File upload
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("File too large, max 5MB");
      return;
    }

    setFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  // ✅ Pre-submit
  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (!formData.department_id || !formData.issue_type || !formData.description) {
      toast.warning("Please fill all required fields");
      return;
    }
    setShowConfirm(true);
  };

  // ✅ Submit complaint
  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.warning("⚠️ Please login first");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => data.append(key, val));
      if (file) data.append("photo", file);

      await axios.post(`${API_URL}/user/report`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("✅ Complaint reported successfully!");
      setSubmitted(true);
      setRedirectCountdown(5);

      // Reset form
      setFormData({
        department_id: "",
        issue_type: "",
        description: "",
        location: "",
        preferred_contact_method: "",
        occurred_on: "",
        email: "",
        phone_number: "",
      });
      setFile(null);
      setPreview(null);
      setShowConfirm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "❌ Failed to report issue");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Auto-redirect after submission
  useEffect(() => {
    if (!submitted) return;
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate("/userdashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted, navigate]);

  return (
    <div className="report-issue-container">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      {submitted ? (
        <div className="success-screen">
          <h2>✅ Complaint Submitted</h2>
          <p>
            Redirecting to <b>My Complaints</b> in {redirectCountdown} sec...
          </p>
          <button
            type="button"
            className="btn-view"
            onClick={() => navigate("/userdashboard")}
          >
            📋 Go to My Complaints Now
          </button>
        </div>
      ) : (
        <form onSubmit={handlePreSubmit} className="report-form">
          <h2>{t.title}</h2>

          {/* Department Dropdown */}
          <select
            name="department_id"
            value={formData.department_id}
            onChange={handleChange}
            required
          >
            <option value="">{t.department}</option>
            {departments.length > 0 ? (
              departments.map((dep) => (
                <option key={dep.department_id} value={dep.department_id}>
                  {language === "kn" && dep.kn_name ? dep.kn_name : dep.name}
                </option>
              ))
            ) : (
              <option disabled>No departments available</option>
            )}
          </select>

          {/* Issue Type */}
          <input
            type="text"
            name="issue_type"
            placeholder={t.issueType}
            value={formData.issue_type}
            onChange={handleChange}
            required
          />

          {/* Description */}
          <textarea
            name="description"
            placeholder={t.description}
            value={formData.description}
            onChange={handleChange}
            required
          />

          {/* Location */}
          <input
            type="text"
            name="location"
            placeholder={t.location}
            value={formData.location}
            onChange={handleChange}
          />

          {/* Preferred Contact */}
          <label>Preferred Contact</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="preferred_contact_method"
                value="email"
                checked={formData.preferred_contact_method === "email"}
                onChange={handleChange}
              />
              {t.email}
            </label>
            <label>
              <input
                type="radio"
                name="preferred_contact_method"
                value="phone"
                checked={formData.preferred_contact_method === "phone"}
                onChange={handleChange}
              />
              {t.phone}
            </label>
          </div>

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder={t.email}
            value={formData.email}
            onChange={handleChange}
          />

          {/* Phone */}
          <input
            type="tel"
            name="phone_number"
            placeholder={t.phone}
            value={formData.phone_number}
            onChange={handleChange}
          />

          {/* Occurred Date */}
          <label>{t.date}</label>
          <input
            type="date"
            name="occurred_on"
            value={formData.occurred_on}
            onChange={handleChange}
          />

          {/* File Upload */}
          <label>{t.photo}</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {preview && (
            <img
              src={preview}
              alt="Preview"
              style={{
                width: "140px",
                height: "140px",
                borderRadius: "6px",
                marginTop: "8px",
                border: "1px solid #ccc",
              }}
            />
          )}

          {/* Submit Button */}
          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : t.submit}
          </button>
        </form>
      )}

      {/* Confirmation Modal */}
      {showConfirm && !submitted && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h3>{t.confirm}</h3>
            <p>
              Are you sure you want to submit this complaint? Please review the
              details carefully.
            </p>
            <div className="confirm-actions">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-cancel"
              >
                {t.goBack}
              </button>
              <button onClick={handleSubmit} className="btn-submit">
                {t.confirmSubmit}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportIssue;
