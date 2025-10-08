import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import Calendar from "react-calendar";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-calendar/dist/Calendar.css";
import "react-toastify/dist/ReactToastify.css";
import "./StaffDashboard.css";
import Chatbot from "./chatbot";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const STATUS_MAP = {
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Completed",
};

// Sidebar Component
const Sidebar = ({ activeSection, setActiveSection, onLogout, t, language, setLanguage }) => {
  const tabs = [
    { key: "complaints", label: t.assignedComplaints },
    { key: "schedule", label: t.schedule },
    { key: "notifications", label: t.notifications },
  ];

  return (
    <aside className="sidebar">
        {/* ✅ Language Switcher → Top-Right Corner */}
      <div
        style={{
          position: "fixed",
          top: "15px",
          right: "20px",
          zIndex: 9999,
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

<div className="logo-container">
  <img
    src="/Images/ruraledge-logo.png"
    alt="Logo"
    className="dashboard-logo"
  />
  <span>RuralEdge</span>
</div>

      <ul>
        {tabs.map(({ key, label }) => (
          <motion.li
            key={key}
            whileHover={{ scale: 1.05, x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection(key)}
            className={activeSection === key ? "active-tab" : ""}
          >
            {label}
          </motion.li>
        ))}
      </ul>
      <button
        onClick={onLogout}
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
    </aside>
  );
};

// Complaints Table
// Complaints Table
const ComplaintsTable = ({ complaints, onSelectComplaint, onAcceptComplaint, t, tStatus }) => {
  if (!complaints) return <p>{t.loadingComplaints}</p>;

  return (
    <section className="complaints">
      <h3 className="section-title">{t.assignedComplaints}</h3>
      <table>
        <thead>
          <tr>
            <th>{t.id}</th>
            <th>{t.type}</th>
            <th>{t.location}</th>
            <th>{t.reportedOn}</th>
            <th>{t.due}</th>
            <th>{t.status}</th>
            <th>{t.resolutionNotes}</th>
            <th>{t.resolutionImage}</th>
            <th>{t.action}</th>
          </tr>
        </thead>
        <tbody>
          {complaints.length > 0 ? (
            complaints.map((c) => (
              <tr key={c.complaint_id} onClick={() => onSelectComplaint(c.complaint_id)}>
                <td>#{c.complaint_id.slice(0, 5)}</td>
                <td>{c.issue_type}</td>

                {/* ✅ LOCATION + VIEW DIRECTION BUTTON */}
                <td>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
                    <span>{c.location}</span>
                    <button
                      style={{
                        marginTop: "4px",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        border: "none",
                        background: "#007bff",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "0.8em",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          `https://www.google.com/maps?q=${encodeURIComponent(c.location)}`,
                          "_blank"
                        );
                      }}
                    >
                      View Directions
                    </button>
                  </div>
                </td>

                <td>{c.created_on?.slice(0, 10) || "—"}</td>
                <td>{c.scheduled_visit?.slice(0, 10) || "—"}</td>
                <td>
                  <span
                    style={{
                      background:
                        c.status === "resolved"
                          ? "#28a745"
                          : c.status === "in_progress"
                          ? "#ffc107"
                          : "#dc3545",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "0.85em",
                    }}
                  >
                    {tStatus(c.status)}
                  </span>
                </td>

                <td>{c.resolution_notes || "—"}</td>
                <td>
                  {c.resolution_image ? (
                    <img
                      src={`${API_URL}/uploads/${c.resolution_image}`}
                      alt="Resolution"
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                        borderRadius: "5px",
                      }}
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  {c.status === "assigned" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcceptComplaint(c.complaint_id);
                      }}
                    >
                      {t.accept}
                    </button>
                  )}
                  {c.status === "in_progress" && (
                    <span style={{ fontSize: "0.85em", color: "#007bff" }}>
                      {t.readyToUpdate}
                    </span>
                  )}
                  {c.status === "resolved" && <span>{t.completed}</span>}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" style={{ textAlign: "center" }}>
                {t.noComplaintsAssigned}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
};


// Complaint Details Modal
const ComplaintDetailsModal = ({ complaint, history, onClose, refreshComplaint, t, tStatus }) => {
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("resolution_notes", notes);
      if (image) formData.append("resolvedImage", image);

      const res = await axios.post(
        `${API_URL}/staff/resolve/${complaint.complaint_id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Server will emit the real-time update. We simply refresh local state.
      toast.success(res.data.message || t.complaintUpdated);
      setNotes("");
      setImage(null);

      // Refresh the single complaint + list
      if (typeof refreshComplaint === "function") {
        await refreshComplaint(complaint.complaint_id);
      }
    } catch (err) {
      console.error("Update failed:", err);
      toast.error(err.response?.data?.error || t.updateFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="modal" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
        <div className="details-section">
  <h3>{t.complaintDetails}</h3>
  <p><strong>{t.id}:</strong> {complaint.complaint_id}</p>
  <p><strong>{t.type}:</strong> {complaint.issue_type}</p>
  {/* <p><strong>{t.location}:</strong> {complaint.location}</p> */}
  <p>
  <strong>{t.location}:</strong> {complaint.location}
  <button
    style={{
      marginLeft: "10px",
      padding: "4px 8px",
      borderRadius: "6px",
      border: "none",
      background: "#007bff",
      color: "white",
      cursor: "pointer",
    }}
    onClick={() =>
      window.open(
        `https://www.google.com/maps?q=${encodeURIComponent(complaint.location)}`,
        "_blank"
      )
    }
  >
    View Directions
  </button>
</p>

  <p><strong>{t.reportedOn}:</strong> {complaint.created_on?.slice(0, 10) || "—"}</p>
  <p><strong>{t.status}:</strong> {tStatus(complaint.status)}</p>
  <p><strong>{t.notes}:</strong> {complaint.resolution_notes || "—"}</p>
  {complaint.resolution_image && (
    <img
      src={`${API_URL}/uploads/${complaint.resolution_image}`}
      alt="Resolution"
      style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", marginBottom: "10px" }}
    />
  )}
</div>

{complaint.status === "in_progress" && (
  <div className="update-section">
    <h4>{t.updateProgress}</h4>
    <form onSubmit={handleUpdate}>
      <label>
        {t.notesLabel}
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <label>
        {t.addImage}
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? t.submitting : t.submit}
      </button>
    </form>
  </div>
)}


<div className="history-section">
  <h4>{t.statusHistory}</h4>
  <ul className="history">
    {history.map((h) => (
      <li key={h.history_id}>
        <strong>{tStatus(h.status)}</strong> – {h.notes || "—"} ({new Date(h.updated_on).toLocaleString()})
      </li>
    ))}
  </ul>
</div>

        <button onClick={onClose} className="close-btn">{t.close}</button>
      </motion.div>
    </motion.div>
  );
};

// Schedule Calendar
// Schedule Calendar
const ScheduleCalendar = ({ deadlines, t }) => {
  const [selectedDate, setSelectedDate] = useState(null); // Date object

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const selectedDateStr = selectedDate ? selectedDate.toISOString().slice(0, 10) : null;

  const grouped = deadlines.reduce((acc, d) => {
    const dateStr = d.scheduled_visit?.slice(0, 10);
    if (!dateStr) return acc;
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(d);
    return acc;
  }, {});

  const displayDeadlines = selectedDateStr ? grouped[selectedDateStr] || [] : deadlines;

  return (
    <section className="schedule">
      <h3 className="section-title">{t.scheduleCalendar}</h3>
      <Calendar
        value={selectedDate}
        onClickDay={(date) => setSelectedDate(date)}
        tileClassName={({ date, view }) => {
          if (view !== "month") return "";
          const formatted = date.toISOString().slice(0, 10);

          if (formatted === selectedDateStr) {
            return "selected-calendar-day"; // green highlight for selected date
          }

          if (formatted === todayStr) {
            return "today-calendar-day"; // red highlight for today
          }

          return "";
        }}
        tileContent={({ date, view }) => {
          if (view !== "month") return null;
          const formatted = date.toISOString().slice(0, 10);
          const jobs = grouped[formatted] || [];
          if (jobs.length) {
            return (
              <div style={{ textAlign: "center", fontSize: "0.75em", marginTop: "2px" }}>
                {jobs.length > 1 ? `(${jobs.length})` : "📍"}
              </div>
            );
          }
          return null;
        }}
      />

      <div style={{ marginTop: "15px" }}>
        {displayDeadlines.length === 0 && (
          <p>
            {t.noScheduledVisits}
            {selectedDateStr ? ` ${t.on} ${selectedDateStr}` : ""}.
          </p>
        )}
        {displayDeadlines.map((d) => (
          <div key={d.complaint_id} style={{ marginBottom: "10px" }}>
            <strong
              style={{
                color:
                  d.scheduled_visit?.slice(0, 10) === todayStr ? "#dc3545" : "#003366",
              }}
            >
              {d.scheduled_visit?.slice(0, 10)}{" "}
              {d.scheduled_visit?.slice(0, 10) === todayStr && `(${t.today})`}
            </strong>
            <ul>
              <li>
                {t.complaintShort} #{d.complaint_id.slice(0, 5)} ({d.issue_type}) {t.at}{" "}
                {d.location}
              </li>
            </ul>
          </div>
        ))}
        {selectedDateStr && displayDeadlines.length > 0 && (
          <button
            onClick={() => setSelectedDate(null)}
            style={{
              marginTop: "10px",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {t.showAllDates}
          </button>
        )}
      </div>
    </section>
  );
};

// Notifications
const Notifications = ({ complaints, deadlines, t }) => {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <section className="notifications">
      <h3 className="section-title">{t.notifications}</h3>
      <ul>
        {complaints.filter((c) => c.status === "assigned").map((c) => (
          <li key={c.complaint_id}>🆕 {t.complaintShort} #{c.complaint_id.slice(0, 5)} - {c.issue_type} {t.at} {c.location}</li>
        ))}
        {deadlines.map((d) =>
          d.scheduled_visit?.slice(0, 10) === today ? (
            <li key={d.complaint_id}>⚠️ {t.complaintShort} #{d.complaint_id.slice(0, 5)} {t.dueToday}</li>
          ) : null
        )}
      </ul>
    </section>
  );
};



// Main Dashboard
const StaffDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [history, setHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [activeSection, setActiveSection] = useState("complaints");

  const [language, setLanguage] = useState(localStorage.getItem("lang") || "en");
  const navigate = useNavigate();
  const staffId = localStorage.getItem("staffId");
  const staffName = localStorage.getItem("staffName") || "Staff";

  // Translations
  const i18n = {
    en: {
      welcome: "Welcome",
      assignedComplaints: "Assigned Complaints",
      schedule: "Schedule",
      notifications: "Notifications",
      logout: "Logout",
      loadingComplaints: "Loading complaints...",
      id: "ID",
      type: "Type",
      location: "Location",
      reportedOn: "Reported On",
      due: "Due",
      status: "Status",
      resolutionNotes: "Resolution Notes",
      resolutionImage: "Resolution Image",
      action: "Action",
      accept: "Accept",
      readyToUpdate: "Ready to update",
      completed: "Completed",
      noComplaintsAssigned: "No complaints assigned.",
      complaintDetails: "Complaint Details",
      notes: "Notes",
      updateProgress: "Update Progress",
      notesLabel: "Notes:",
      addImage: "Add Image:",
      submit: "Submit",
      submitting: "Submitting...",
      statusHistory: "Status History",
      close: "Close",
      complaintUpdated: "Complaint updated successfully!",
      updateFailed: "Update failed",
      scheduleCalendar: "Schedule Calendar",
      today: "Today",
      noScheduledVisits: "No scheduled visits",
      on: "on",
      complaintShort: "Complaint",
      at: "at",
      showAllDates: "Show All Dates",
      dueToday: "is due today!",
      helpGreeting: "Hi! How can I help you today?",
      helpReply: "A support rep will reach out shortly.",
      typing: "Typing...",
      askSomething: "Ask something...",
      send: "Send",
      welcomeUser: (name) => `Welcome, ${name}!`,
      statusLabels: {
        assigned: "Assigned",
        in_progress: "In Progress",
        resolved: "Completed",
      },
    },
    kn: {
      welcome: "ಸ್ವಾಗತ",
      assignedComplaints: "ನಿಯೋಜಿತ ದೂರುಗಳು",
      schedule: "ವೇಳಾಪಟ್ಟಿ",
      notifications: "ಅಧಿಸೂಚನೆಗಳು",
      logout: "ಲಾಗ್ ಔಟ್",
      loadingComplaints: "ದೂರುಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
      id: "ಐಡಿ",
      type: "ಪ್ರಕಾರ",
      location: "ಸ್ಥಳ",
      reportedOn: "ವರದಿ ದಿನಾಂಕ",
      due: "ಗಡಿವೇಳೆ",
      status: "ಸ್ಥಿತಿ",
      resolutionNotes: "ಪರಿಹಾರದ ಟಿಪ್ಪಣಿಗಳು",
      resolutionImage: "ಪರಿಹಾರದ ಚಿತ್ರ",
      action: "ಕ್ರಿಯೆ",
      accept: "ಸ್ವೀಕರಿಸಿ",
      readyToUpdate: "ನವೀಕರಿಸಲು ಸಿದ್ಧ",
      completed: "ಪೂರ್ಣವಾಗಿದೆ",
      noComplaintsAssigned: "ಯಾವುದೇ ದೂರುಗಳನ್ನು ನಿಯೋಜಿಸಲಾಗಿಲ್ಲ.",
      complaintDetails: "ದೂರು ವಿವರಗಳು",
      notes: "ಟಿಪ್ಪಣಿಗಳು",
      updateProgress: "ಪ್ರಗತಿ ನವೀಕರಿಸಿ",
      notesLabel: "ಟಿಪ್ಪಣಿಗಳು:",
      addImage: "ಚಿತ್ರವನ್ನು ಸೇರಿಸಿ:",
      submit: "ಸಲ್ಲಿಸಿ",
      submitting: "ಸಲ್ಲಿಸುತ್ತಿದೆ...",
      statusHistory: "ಸ್ಥಿತಿಯ ಇತಿಹಾಸ",
      close: "ಮುಚ್ಚಿ",
      complaintUpdated: "ದೂರು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!",
      updateFailed: "ನವೀಕರಣ ವಿಫಲವಾಗಿದೆ",
      scheduleCalendar: "ವೇಳಾಪಟ್ಟಿ ಕ್ಯಾಲೆಂಡರ್",
      today: "ಇಂದು",
      noScheduledVisits: "ಯಾವುದೇ ನಿಗದಿತ ಭೇಟಿಗಳಿಲ್ಲ",
      on: "ರಂದು",
      complaintShort: "ದೂರು",
      at: "ನಲ್ಲಿ",
      showAllDates: "ಎಲ್ಲಾ ದಿನಾಂಕಗಳನ್ನು ತೋರಿಸಿ",
      dueToday: "ಇಂದು ಗಡಿವೇಳೆ!",
      helpGreeting: "ಹಾಯ್! ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
      helpReply: "ಬೆಂಬಲ ಪ್ರತಿನಿಧಿ ಶೀಘ್ರದಲ್ಲೇ ಸಂಪರ್ಕಿಸುತ್ತಾರೆ.",
      typing: "ಟೈಪ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
      askSomething: "ಏನಾದರೂ ಕೇಳಿ...",
      send: "ಕಳುಹಿಸಿ",
      welcomeUser: (name) => `ಸ್ವಾಗತ, ${name}!`,
      statusLabels: {
        assigned: "ನಿಯೋಜಿಸಲಾಗಿದೆ",
        in_progress: "ಪ್ರಗತಿಯಲ್ಲಿದೆ",
        resolved: "ಪೂರ್ಣವಾಗಿದೆ",
      },
    },
  };

  const t = i18n[language];

  // map status per language
  const tStatus = (status) => t.statusLabels[status] || status;

  // persist language selection
  useEffect(() => {
    localStorage.setItem("lang", language);
  }, [language]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("staffId");
    localStorage.removeItem("staffName");
    navigate("/LandingPage");
  };

  // Fetch all assigned complaints
  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || !staffId) {
      navigate("/login");
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/staff/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data || [];
      setComplaints(data);
      setDeadlines(data.filter((c) => c.scheduled_visit));
    } catch (err) {
      console.error(err);
      toast.error(t.failedToLoadAssigned || "Failed to load assigned complaints");
    }
  }, [staffId, navigate, t.failedToLoadAssigned]);

  // Refresh one complaint + its history
  const refreshComplaint = async (complaintId) => {
    const token = localStorage.getItem("token");
    try {
      const [complaintsRes, historyRes] = await Promise.all([
        axios.get(`${API_URL}/staff/complaints`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios
          .get(`${API_URL}/complaints/${complaintId}/history`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .catch(() => ({ data: [] })), // tolerate if history route not present yet
      ]);
      setComplaints(complaintsRes.data || []);
      const updated = (complaintsRes.data || []).find((c) => c.complaint_id === complaintId);
      setSelectedDetails(updated || null);
      setHistory(historyRes.data || []);
    } catch (err) {
      console.error("Failed to refresh complaint:", err);
      toast.error(t.couldNotRefresh || "Could not refresh complaint data");
    }
  };

  // Open details modal
  const handleSelectComplaint = async (complaintId) => {
    const token = localStorage.getItem("token");
    try {
      const [complaintRes, historyRes] = await Promise.all([
        axios
          .get(`${API_URL}/complaints/${complaintId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .catch(() => ({ data: complaints.find((c) => c.complaint_id === complaintId) })), // fallback
        axios
          .get(`${API_URL}/complaints/${complaintId}/history`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .catch(() => ({ data: [] })),
      ]);
      if (!complaintRes.data) throw new Error("Complaint not found");
      setSelectedDetails(complaintRes.data);
      setHistory(historyRes.data || []);
      setShowModal(true);
    } catch (err) {
      console.error("Failed to load complaint details:", err);
      toast.error(t.couldNotLoadDetails || "Could not load complaint details");
    }
  };

  // Accept complaint
  const handleAcceptComplaint = async (complaintId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `${API_URL}/staff/accept/${complaintId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(t.complaintAccepted || "Complaint accepted!");
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || t.failedToAccept || "Failed to accept complaint");
    }
  };

  // SOCKET.IO: real-time updates
  useEffect(() => {
    fetchData();

    const token = localStorage.getItem("token");
    if (!token || !staffId) return;

    const socket = io(API_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      socket.emit("joinStaffRoom", staffId);
    });

    socket.on("connect_error", (e) => {
      console.warn("Socket connect error:", e?.message || e);
    });

    // Assigned by admin
    socket.on("assigned_complaint", (complaint) => {
      if (!complaint) return;
      if (complaint.assigned_staff_id !== staffId) return;

      setComplaints((prev) =>
        prev.some((c) => c.complaint_id === complaint.complaint_id)
          ? prev
          : [complaint, ...prev]
      );

      if (complaint.scheduled_visit) {
        setDeadlines((prev) =>
          prev.some((c) => c.complaint_id === complaint.complaint_id)
            ? prev
            : [complaint, ...prev]
        );
      }

      toast.info(`${t.newComplaintAssigned || "New complaint assigned"}: #${complaint.complaint_id.slice(0, 5)}`);
    });

    // Any complaint status/content update (accept, resolve, etc.)
    socket.on("updateComplaint", (updatedComplaint) => {
      if (!updatedComplaint) return;

      setComplaints((prev) =>
        prev.map((c) =>
          c.complaint_id === updatedComplaint.complaint_id ? updatedComplaint : c
        )
      );

      if (updatedComplaint.scheduled_visit) {
        setDeadlines((prev) => {
          const other = prev.filter((c) => c.complaint_id !== updatedComplaint.complaint_id);
          return [updatedComplaint, ...other];
        });
      }

      toast.success(
        `${t.complaintShort} #${updatedComplaint.complaint_id.slice(0, 5)} ${t.updated || "updated"}`
      );
    });

    return () => socket.disconnect();
  }, [fetchData, staffId, t.newComplaintAssigned, t.complaintShort, t.updated]);

  return (
    <div className="dashboard">
      <ToastContainer position="top-right" autoClose={3000} />
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onLogout={handleLogout}
        t={t}
        language={language}
        setLanguage={setLanguage}
      />
      <main className="main-content">
        <div className="welcome-message" style={{ marginBottom: "20px" }}>
          <h2>{t.welcomeUser(staffName)}</h2>
        </div>

        {activeSection === "complaints" && (
          <ComplaintsTable
            complaints={complaints}
            onSelectComplaint={handleSelectComplaint}
            onAcceptComplaint={handleAcceptComplaint}
            t={t}
            tStatus={tStatus}
          />
        )}
        {activeSection === "schedule" && <ScheduleCalendar deadlines={deadlines} t={t} />}
        {activeSection === "notifications" && (
          <Notifications complaints={complaints} deadlines={deadlines} t={t} />
        )}
        

        <AnimatePresence>
          {showModal && selectedDetails && (
            <ComplaintDetailsModal
              complaint={selectedDetails}
              history={history}
              onClose={() => setShowModal(false)}
              refreshComplaint={refreshComplaint}
              t={t}
              tStatus={tStatus}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default StaffDashboard;
