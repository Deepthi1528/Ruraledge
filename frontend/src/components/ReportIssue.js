import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

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
      useCurrent: "Use Current Location",
      email: "Enter your email",
      phone: "Enter your phone number",
      date: "When did this happen?",
      photo: "Attach a Photo (optional)",
      submit: "Submit Complaint",
      confirm: "Confirm Complaint",
      goBack: "Go Back",
      confirmSubmit: "Confirm & Submit",
      required: "This field is required",
    },
    kn: {
      title: "ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ",
      department: "-- ಇಲಾಖೆ ಆಯ್ಕೆಮಾಡಿ --",
      issueType: "ಸಮಸ್ಯೆಯ ಪ್ರಕಾರ",
      description: "ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ",
      location: "ಸ್ಥಳ",
      useCurrent: "ಪ್ರಸ್ತುತ ಸ್ಥಳ ಬಳಸಿ",
      email: "ನಿಮ್ಮ ಇಮೇಲ್ ನಮೂದಿಸಿ",
      phone: "ನಿಮ್ಮ ಫೋನ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ",
      date: "ಇದು ಯಾವಾಗ ಸಂಭವಿಸಿತು?",
      photo: "ಫೋಟೋ ಅಟ್ಯಾಚ್ ಮಾಡಿ (ಐಚ್ಛಿಕ)",
      submit: "ದೂರು ಸಲ್ಲಿಸಿ",
      confirm: "ದೂರು ದೃಢೀಕರಿಸಿ",
      goBack: "ಹಿಂದಿರುಗಿ",
      confirmSubmit: "ದೃಢೀಕರಿಸಿ ಮತ್ತು ಸಲ್ಲಿಸಿ",
      required: "ಅಗತ್ಯ ಕ್ಷೇತ್ರ",
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

  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [emailSent, setEmailSent] = useState(false); // ✅ Add this


  const mapRef = useRef(null);
  const routeRef = useRef(null);

  // ✅ Authentication check
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
        if (Array.isArray(res.data)) setDepartments(res.data);
        else {
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
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ✅ File upload
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Only images allowed");
    if (f.size > 5 * 1024 * 1024) return toast.error("Max 5MB");

    setFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  // ✅ Form validation
const validateForm = () => {
  const newErrors = {};

  // Required fields
  if (!formData.department_id) newErrors.department_id = t.required;
  if (!formData.issue_type.trim()) newErrors.issue_type = t.required;
  if (!formData.description.trim()) newErrors.description = t.required;
  if (!formData.occurred_on) newErrors.occurred_on = t.required;

  // Contact Method Validations
  if (formData.preferred_contact_method === "email") {
    if (!formData.email.trim()) {
      newErrors.email = t.required;
    } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(formData.email)) {
      newErrors.email = "Only Gmail addresses are allowed";
    }
  }

  if (formData.preferred_contact_method === "phone") {
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = t.required;
    } else if (!/^\d{10}$/.test(formData.phone_number)) {
      newErrors.phone_number = "Phone number must be exactly 10 digits";
    }
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};



  // ✅ Pre-submit
  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning("⚠️ Please fix the highlighted errors");
      return;
    }
    setShowConfirm(true);
  };

  // ✅ Submit complaint
const handleSubmit = async () => {
  const token = localStorage.getItem("token");
  if (!token) return toast.warning("⚠️ Please login first");

  try {
    setLoading(true);
    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => data.append(k, v));
    if (file) data.append("photo", file);

    // ✅ Single API call
    const response = await axios.post(`${API_URL}/user/report`, data, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
    });

    toast.success("✅ Complaint reported successfully!");
    setEmailSent(response.data.emailSent || false); // ✅ track if email was sent
    setSubmitted(true);
    setRedirectCountdown(5);

    // Reset form
    setFormData({
      department_id: "", issue_type: "", description: "", location: "",
      preferred_contact_method: "", occurred_on: "", email: "", phone_number: "",
    });
    setFile(null);
    setPreview(null);
    setShowConfirm(false);
    setErrors({});
  } catch (err) {
    toast.error(err.response?.data?.message || "❌ Failed to report issue");
  } finally {
    setLoading(false);
  }
};


  // ✅ Redirect countdown
  useEffect(() => {
    if (!submitted) return;
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate("/userdashboard", { state: { openTab: "complaints" } });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted, navigate]);

  // ✅ Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map", { center: [12.9716, 77.5946], zoom: 12 });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapRef.current);
    }
  }, []);

  // ✅ Update map on location change
  useEffect(() => {
    if (!mapRef.current || !formData.location.trim()) return;

    const locName = formData.location.trim();
    axios
      .get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locName)}`)
      .then((res) => {
        if (res.data.length > 0) {
          const { lat, lon, display_name } = res.data[0];
          mapRef.current.setView([lat, lon], 14);

          if (routeRef.current) mapRef.current.removeControl(routeRef.current);

          routeRef.current = L.Routing.control({
            waypoints: [L.latLng(12.9716, 77.5946), L.latLng(lat, lon)],
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            createMarker: () => L.marker([lat, lon]).bindPopup(`<b>${display_name}</b>`),
          }).addTo(mapRef.current);
        } else toast.error("⚠️ Location not found");
      })
      .catch(() => toast.error("❌ Error fetching location"));
  }, [formData.location]);

  // ✅ Use current location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");

navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    axios
      .get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
      .then((res) => {
        const place = res.data.display_name;
        setFormData((prev) => ({ ...prev, location: place }));

        // Also update map immediately
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 14);

          if (routeRef.current) mapRef.current.removeControl(routeRef.current);

          routeRef.current = L.Routing.control({
            waypoints: [L.latLng(12.9716, 77.5946), L.latLng(latitude, longitude)],
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            createMarker: () =>
              L.marker([latitude, longitude]).bindPopup(`<b>${place}</b>`),
          }).addTo(mapRef.current);
        }
      })
      .catch(() => toast.error("Error fetching place name from coordinates"));
  },
  (err) => toast.error(`Unable to retrieve your location: ${err.message}`),
  { enableHighAccuracy: true, timeout: 10000 }
);

  };

  return (
    <div className="report-issue-container">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

     {submitted ? (
  <div className="success-screen">
    <h2>✅ Complaint Submitted</h2>
    {emailSent && <p style={{ color: "green", margin: "8px 0" }}>📧 Confirmation email sent to your email address!</p>}
    <p>Redirecting to <b>My Complaints</b> in {redirectCountdown} sec...</p>
    <button
      type="button"
      className="btn-view"
      onClick={() => navigate("/UserDashboard", { state: { openTab: "complaints" } })}
    >📋 Go to My Complaints Now</button>
  </div>
) : (
        <form onSubmit={handlePreSubmit} className="report-form">
          <h2>{t.title}</h2>

          {/* Department */}
          <select name="department_id" value={formData.department_id} onChange={handleChange}>
            <option value="">{t.department}</option>
            {departments.length > 0
              ? departments.map((dep) => (
                  <option key={dep.department_id} value={dep.department_id}>
                    {language === "kn" && dep.kn_name ? dep.kn_name : dep.name}
                  </option>
                ))
              : <option disabled>No departments available</option>}
          </select>
          {errors.department_id && <span className="error-text">{errors.department_id}</span>}

          {/* Issue Type */}
          <input type="text" name="issue_type" placeholder={t.issueType} value={formData.issue_type} onChange={handleChange} />
          {errors.issue_type && <span className="error-text">{errors.issue_type}</span>}

          {/* Description */}
          <textarea name="description" placeholder={t.description} value={formData.description} onChange={handleChange} />
          {errors.description && <span className="error-text">{errors.description}</span>}

          {/* Location */}
          <input type="text" name="location" placeholder={t.location} value={formData.location} onChange={handleChange} />
          <button type="button" className="btn-current" onClick={handleUseCurrentLocation}>{t.useCurrent}</button>

          {/* Map */}
          <div id="map" style={{ height: "300px", width: "100%", margin: "10px 0" }} />
          
      {/* Contact Details */}
<h3 style={{ marginTop: "20px" }}>Contact Details</h3>

{/* Preferred Contact Method */}
<label style={{ marginTop: "10px", display: "block" }}>Preferred Contact Method</label>
<select
  name="preferred_contact_method"
  value={formData.preferred_contact_method}
  onChange={handleChange}
>
  <option value="">-- Select Method --</option>
  <option value="email">Email</option>
  <option value="phone">Phone</option>
</select>

{/* Conditionally Render Email Field */}
{formData.preferred_contact_method === "email" && (
  <input
    type="email"
    name="email"
    placeholder={t.email}
    value={formData.email}
    onChange={handleChange}
    required
  />
)}

{/* Conditionally Render Phone Field */}
{formData.preferred_contact_method === "phone" && (
  <input
    type="tel"
    name="phone_number"
    placeholder="Enter 10-digit phone number"
    value={formData.phone_number.replace(
      /(\d{3})(\d{3})(\d{0,4})/,
      (_, p1, p2, p3) => [p1, p2, p3].filter(Boolean).join(" ")
    )}
    onChange={(e) => {
      let value = e.target.value.replace(/\D/g, ""); // remove all non-digits
      if (value.length > 10) value = value.slice(0, 10); // restrict to 10 digits
      setFormData((prev) => ({ ...prev, phone_number: value }));

      if (errors.phone_number) setErrors((prev) => ({ ...prev, phone_number: "" }));
    }}
    onPaste={(e) => {
      const paste = e.clipboardData.getData("text");
      if (!/^\d{0,10}$/.test(paste)) e.preventDefault();
    }}
    maxLength={12} // accounts for spaces in formatted display
    required
  />
)}
{errors.phone_number && <span className="error-text">{errors.phone_number}</span>}


          {/* Occurred Date */}
          <label>{t.date}</label>
          <input type="date" name="occurred_on" value={formData.occurred_on} onChange={handleChange} />
          {errors.occurred_on && <span className="error-text">{errors.occurred_on}</span>}

          {/* File Upload */}
          <label>{t.photo}</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {preview && <img src={preview} alt="Preview" style={{ width: "140px", height: "140px", borderRadius: "6px", marginTop: "8px", border: "1px solid #ccc" }} />}

          {/* Submit Button */}
          <button type="submit" disabled={loading}>{loading ? "Submitting..." : t.submit}</button>
        </form>
      )}

      {/* Confirmation Modal */}
      {showConfirm && !submitted && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h3>{t.confirm}</h3>
            <p>Are you sure you want to submit this complaint? Please review the details carefully.</p>
            <div className="confirm-actions">
              <button onClick={() => setShowConfirm(false)} className="btn-cancel">{t.goBack}</button>
              <button onClick={handleSubmit} className="btn-submit">{t.confirmSubmit}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportIssue;
