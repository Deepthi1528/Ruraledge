import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ReportIssue from "./ReportIssue";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Chatbot from "./chatbot";
import "./UserDashboard.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function UserDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("report");
  const [complaints, setComplaints] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("en");

  // ✅ Translations
  const translations = {
    en: {
      reportIssue: "Report Issue",
      myComplaints: "My Complaints",
      alertsTab: "Alerts",
      logout: "Logout",
      welcome: "Welcome",
      noComplaints: "No complaints reported yet.",
      noAlerts: "No active alerts",
      importantAlerts: "Important Alerts",
    },
    kn: {
      reportIssue: "ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ",
      myComplaints: "ನನ್ನ ದೂರುಗಳು",
      alertsTab: "ಎಚ್ಚರಿಕೆಗಳು",
      logout: "ಲಾಗ್ ಔಟ್",
      welcome: "ಸ್ವಾಗತ",
      noComplaints: "ಯಾವುದೇ ದೂರುಗಳನ್ನು ವರದಿ ಮಾಡಲಾಗಿಲ್ಲ.",
      noAlerts: "ಯಾವುದೇ ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ",
      importantAlerts: "ಮುಖ್ಯ ಎಚ್ಚರಿಕೆಗಳು",
    },
  };

  const t = translations[language];

  // ✅ Verify token & fetch user details
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");

    if (!token || role !== "user" || !userId) {
      toast.error("⚠️ Please login first");
      navigate("/login");
      return;
    }

    axios
      .get(`${API_URL}/auth/verify-token`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setUser({ id: userId, name: userName || "User" });
        setLoading(false);
      })
      .catch(() => {
        toast.error("Session expired. Please login again.");
        localStorage.clear();
        navigate("/login");
      });
  }, [navigate]);

  // ✅ Fetch complaints
  const fetchComplaints = useCallback(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    axios
      .get(`${API_URL}/user/${user.id}/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setComplaints(res.data))
      .catch((err) => console.error("Error fetching complaints:", err));
  }, [user]);

  useEffect(() => {
    if (activeTab === "complaints") fetchComplaints();
  }, [activeTab, fetchComplaints]);

  // ✅ Fetch alerts
  useEffect(() => {
    if (activeTab === "alerts") {
      axios
        .get(`${API_URL}/api/alerts`)
        .then((res) => setAlerts(res.data))
        .catch((err) => console.error("Error fetching alerts:", err));
    }
  }, [activeTab]);

  // ✅ Format complaint status
  const formatStatus = (status) =>
    status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // ✅ Logout
  const handleLogout = () => {
    localStorage.clear();
    toast.success("✅ Logged out successfully!");
    setTimeout(() => navigate("/LandingPage"), 800);
  };

  if (loading) return <p>Loading dashboard...</p>;
  if (!user) return null;

  return (
    <div className="dashboard-container">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      {/* ✅ Language Switcher → Top-Right Corner */}
      <div
        style={{
          position: "absolute",
          top: "15px",
          right: "20px",
          zIndex: 999,
          background: "#f8f9fa",
          padding: "6px 12px",
          borderRadius: "6px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          fontWeight: "500",
          fontSize: "14px",
        }}
      >
        <span
          style={{
            cursor: "pointer",
            fontWeight: language === "en" ? "bold" : "normal",
            marginRight: "8px",
            color: language === "en" ? "#007bff" : "#333",
          }}
          onClick={() => setLanguage("en")}
        >
          English
        </span>
        |
        <span
          style={{
            cursor: "pointer",
            fontWeight: language === "kn" ? "bold" : "normal",
            marginLeft: "8px",
            color: language === "kn" ? "#007bff" : "#333",
          }}
          onClick={() => setLanguage("kn")}
        >
          ಕನ್ನಡ
        </span>
        <Chatbot/>
      </div>

      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="logo-container">
          <img
            src="/Images/ruraledge-logo.png"
            alt="Logo"
            className="dashboard-logo"
          />
          <span>RuralEdge</span>
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={() => setActiveTab("report")}
          className={activeTab === "report" ? "active-tab" : ""}
        >
          {t.reportIssue}
        </button>
        <button
          onClick={() => setActiveTab("complaints")}
          className={activeTab === "complaints" ? "active-tab" : ""}
        >
          {t.myComplaints}
        </button>
        <button
          onClick={() => setActiveTab("alerts")}
          className={activeTab === "alerts" ? "active-tab" : ""}
        >
          {t.alertsTab}
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            marginTop: "auto",
            padding: "10px 15px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            width: "90%",
            alignSelf: "center",
          }}
        >
          {t.logout}
        </button>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content card">
        <h2>
          {t.welcome}, {user.name} 👋
        </h2>

        {/* Report Issue Tab */}
        {activeTab === "report" && <ReportIssue language={language} />}

        {/* Complaints Tab */}
        {activeTab === "complaints" && (
          <div>
            <h2>{t.myComplaints}</h2>
            {complaints.length === 0 ? (
              <p>{t.noComplaints}</p>
            ) : (
              <table className="complaints-table">
                <thead>
                  <tr>
                    <th>Issue</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Assigned Staff</th>
                    <th>Location</th>
                    <th>Reported On</th>
                    <th>Photo</th>
                    <th>Resolution</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c.complaint_id}>
                      <td>{c.issue_type}</td>
                      <td>{c.department_name}</td>
                      <td
                        style={{
                          color:
                            c.status === "resolved"
                              ? "green"
                              : c.status === "in_progress"
                              ? "orange"
                              : c.status === "rejected"
                              ? "red"
                              : "blue",
                          fontWeight: "bold",
                        }}
                      >
                        {formatStatus(c.status)}
                      </td>
                      <td>{c.staff_name || "Not Assigned"}</td>
                      <td>{c.location}</td>
                      <td>{new Date(c.created_on).toLocaleString()}</td>
                      <td>
                        {c.photo_url ? (
                          <img
                            src={`${API_URL}/uploads/${c.photo_url}`}
                            alt="Complaint"
                            style={{
                              width: "80px",
                              height: "80px",
                              objectFit: "cover",
                              borderRadius: "6px",
                              border: "1px solid #ccc",
                            }}
                          />
                        ) : (
                          "No Photo"
                        )}
                      </td>
                      <td>
                        {c.resolution_image ? (
                          <img
                            src={`${API_URL}/uploads/${c.resolution_image}`}
                            alt="Resolution"
                            style={{
                              width: "80px",
                              height: "80px",
                              objectFit: "cover",
                              borderRadius: "6px",
                              border: "1px solid #ccc",
                            }}
                          />
                        ) : c.resolution_notes ? (
                          c.resolution_notes
                        ) : (
                          "Pending"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === "alerts" && (
          <div>
            <h2>{t.importantAlerts}</h2>
            {alerts.length === 0 ? (
              <p>{t.noAlerts}</p>
            ) : (
              <ul>
                {alerts.map((alert) => (
                  <li key={alert.alert_id}>
                    <b>{alert.title}</b> - {alert.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
