import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "./ReportIssue.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const BASE_COORDS = [12.9716, 77.5946]; // Default office location (Bangalore)

function ReportIssue({ language, onComplaintSubmitted }) {
  const mapRef = useRef(null);
  const routeRef = useRef(null);

  // 🌐 Translations
  const t =
    {
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
    }[language || "en"];

  // 🌍 State
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
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ✅ Fetch departments
  useEffect(() => {
    axios
      .get(`${API_URL}/departments`)
      .then((res) => Array.isArray(res.data) && setDepartments(res.data))
      .catch(() => toast.error("Failed to fetch departments"));
  }, []);

  // ✅ Handle input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
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

  // ✅ Validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.department_id) newErrors.department_id = t.required;
    if (!formData.issue_type.trim()) newErrors.issue_type = t.required;
    if (!formData.description.trim()) newErrors.description = t.required;
    if (!formData.occurred_on) newErrors.occurred_on = t.required;

    if (formData.preferred_contact_method === "email" && !formData.email.trim())
      newErrors.email = t.required;

    if (
      formData.preferred_contact_method === "phone" &&
      !formData.phone_number.trim()
    )
      newErrors.phone_number = t.required;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Pre-submit
  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning("⚠️ Please fix highlighted errors");
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

      await axios.post(`${API_URL}/user/report`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("✅ Complaint submitted successfully!");

      // ✅ Instantly switch to "My Complaints" tab
      if (onComplaintSubmitted) {
        onComplaintSubmitted();
        return;
      }

      // fallback if not passed from parent
      window.location.href = "/UserDashboard";
    } catch (err) {
      toast.error(err.response?.data?.message || "❌ Failed to report issue");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  // ✅ Initialize map
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map", {
        center: BASE_COORDS,
        zoom: 13,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapRef.current);
    }
  }, []);

  // ✅ Clear route safely
  const clearRoute = () => {
    if (routeRef.current) {
      try {
        mapRef.current.removeControl(routeRef.current);
      } catch {}
      routeRef.current = null;
    }
  };

  // ✅ Handle typed location
  useEffect(() => {
    if (!mapRef.current || !formData.location.trim()) return;

    const fetchAndRoute = async () => {
      try {
        const res = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            formData.location.trim()
          )}`
        );

        if (!res.data.length) {
          toast.warning("⚠️ Could not find that location.");
          return;
        }

        const { lat, lon, display_name } = res.data[0];
        setFormData((p) => ({ ...p, location: display_name }));

        mapRef.current.setView([lat, lon], 14);
        clearRoute();

        routeRef.current = L.Routing.control({
          waypoints: [L.latLng(...BASE_COORDS), L.latLng(lat, lon)],
          addWaypoints: false,
          draggableWaypoints: false,
          routeWhileDragging: false,
          createMarker: (i, wp) =>
            L.marker(wp.latLng).bindPopup(
              i === 0 ? "<b>Start (Office)</b>" : `<b>${display_name}</b>`
            ),
        }).addTo(mapRef.current);
      } catch {
        toast.error("❌ Error fetching location");
      }
    };

    fetchAndRoute();
  }, [formData.location]);

  // ✅ Use current location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const address = res.data?.display_name || "Unknown location";

          setFormData((p) => ({ ...p, location: address }));
          mapRef.current.setView([latitude, longitude], 14);
          clearRoute();

          routeRef.current = L.Routing.control({
            waypoints: [L.latLng(...BASE_COORDS), L.latLng(latitude, longitude)],
            addWaypoints: false,
            draggableWaypoints: false,
            routeWhileDragging: false,
            createMarker: (i, wp) =>
              L.marker(wp.latLng).bindPopup(
                i === 0 ? "<b>Start (Office)</b>" : `<b>${address}</b>`
              ),
          }).addTo(mapRef.current);

          toast.success("📍 Current location detected!");
        } catch {
          toast.error("Failed to get address from coordinates");
        }
      },
      (err) => toast.error(`❌ ${err.message}`),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="report-issue-container">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <form onSubmit={handlePreSubmit} className="report-form">
        <h2>{t.title}</h2>

        {/* Department */}
        <select
          name="department_id"
          value={formData.department_id}
          onChange={handleChange}
        >
          <option value="">{t.department}</option>
          {departments.map((d) => (
            <option key={d.department_id} value={d.department_id}>
              {language === "kn" && d.kn_name ? d.kn_name : d.name}
            </option>
          ))}
        </select>
        {errors.department_id && <span className="error-text">{errors.department_id}</span>}

        {/* Issue Type */}
        <input
          type="text"
          name="issue_type"
          placeholder={t.issueType}
          value={formData.issue_type}
          onChange={handleChange}
        />
        {errors.issue_type && <span className="error-text">{errors.issue_type}</span>}

        {/* Description */}
        <textarea
          name="description"
          placeholder={t.description}
          value={formData.description}
          onChange={handleChange}
        />
        {errors.description && <span className="error-text">{errors.description}</span>}

        {/* Location */}
        <input
          type="text"
          name="location"
          placeholder={t.location}
          value={formData.location}
          onChange={handleChange}
        />
        <button type="button" onClick={handleUseCurrentLocation} className="btn-current">
          {t.useCurrent}
        </button>

        <div id="map" style={{ height: "300px", width: "100%", margin: "10px 0" }} />

        {/* Contact */}
        <h3>Contact Details</h3>
        <label>Preferred Contact Method</label>
        <select
          name="preferred_contact_method"
          value={formData.preferred_contact_method}
          onChange={handleChange}
        >
          <option value="">-- Select Method --</option>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
        </select>

        {formData.preferred_contact_method === "email" && (
          <input
            type="email"
            name="email"
            placeholder={t.email}
            value={formData.email}
            onChange={handleChange}
          />
        )}

        {formData.preferred_contact_method === "phone" && (
          <input
            type="tel"
            name="phone_number"
            placeholder={t.phone}
            value={formData.phone_number}
            onChange={handleChange}
          />
        )}

        <label>{t.date}</label>
        <input
          type="date"
          name="occurred_on"
          value={formData.occurred_on}
          onChange={handleChange}
        />

        <label>{t.photo}</label>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {preview && (
          <img
            src={preview}
            alt="Preview"
            style={{ width: "140px", height: "140px", borderRadius: "6px", marginTop: "8px" }}
          />
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : t.submit}
        </button>
      </form>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h3>{t.confirm}</h3>
            <p>Please confirm you want to submit this complaint.</p>
            <div className="confirm-actions">
              <button onClick={() => setShowConfirm(false)} className="btn-cancel">
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
