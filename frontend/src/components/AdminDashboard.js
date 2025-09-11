import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { io } from "socket.io-client";
import "react-toastify/dist/ReactToastify.css";
import Chatbot from "./chatbot";
import "./AdminDashboard.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [modalImage, setModalImage] = useState(null);
  const [modalNotes, setModalNotes] = useState("");
  const [socket, setSocket] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [complaintSearch, setComplaintSearch] = useState("");
  const token = localStorage.getItem("token") || "";

  // ✅ Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  // ✅ Fetch Data
  const fetchData = async () => {
  try {
    const headers = { Authorization: `Bearer ${token}` };

    const usersRes = await axios.get(`${API_URL}/admin/users`, { headers }).catch(() => ({ data: [] }));
    const staffRes = await axios.get(`${API_URL}/admin/staff`, { headers }).catch(() => ({ data: [] }));
    const complaintsRes = await axios.get(`${API_URL}/admin/complaints/all`, { headers }).catch(() => ({ data: [] }));
    const deptRes = await axios.get(`${API_URL}/departments`, { headers }).catch(() => ({ data: [] }));

    setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || []);
    setStaff(Array.isArray(staffRes.data) ? staffRes.data : staffRes.data.data || []);
    setComplaints(Array.isArray(complaintsRes.data) ? complaintsRes.data : complaintsRes.data.data || []);
    setDepartments(Array.isArray(deptRes.data) ? deptRes.data : deptRes.data.data || []);
  } catch (err) {
    console.error("Fetch data error:", err);
    toast.error("Failed to fetch data from server");
  }
};

  // ✅ WebSocket for real-time updates
  useEffect(() => {
    if (!token) return;
    fetchData();

    const s = io(API_URL, { auth: { token } });

    s.on("complaintResolved", (updatedComplaint) => {
      setComplaints((prev) =>
        prev.map((c) => (c.complaint_id === updatedComplaint.complaint_id ? updatedComplaint : c))
      );
      toast.success(`✅ Complaint #${(updatedComplaint.complaint_id || "").slice(0, 5)} resolved`);
    });

    s.on("assigned_complaint", (updatedComplaint) => {
      setComplaints((prev) => {
        const exists = prev.some((c) => c.complaint_id === updatedComplaint.complaint_id);
        return exists
          ? prev.map((c) => (c.complaint_id === updatedComplaint.complaint_id ? updatedComplaint : c))
          : [updatedComplaint, ...prev];
      });
      toast.info(`📌 Complaint #${(updatedComplaint.complaint_id || "").slice(0, 5)} assigned`);
    });

    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [token]);

  // ✅ Handle Assignments
  const handleAssignmentChange = (complaintId, field, value) => {
    setAssignments((prev) => ({
      ...prev,
      [complaintId]: {
        ...prev[complaintId],
        [field]: value,
      },
    }));
  };

  const assignComplaint = async (complaintId, assigned_staff_id, scheduled_visit) => {
    if (!assigned_staff_id || !scheduled_visit) {
      toast.error("Select staff and date");
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        `${API_URL}/admin/assign/${complaintId}`,
        { assigned_staff_id, scheduled_visit },
        { headers }
      );

      toast.success(res.data.message || "Complaint assigned!");
      const updated = res.data.complaint || res.data;

      setComplaints((prev) => prev.map((c) => (c.complaint_id === complaintId ? updated : c)));

      if (socket && socket.connected) socket.emit("assigned_complaint", updated);
    } catch (err) {
      console.error("Assign error:", err);
      toast.error(err.response?.data?.message || "Failed to assign complaint");
    }
  };

  // ✅ Delete Functions
  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await axios.delete(`${API_URL}/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.filter((u) => u.user_id !== id));
      toast.success("User deleted!");
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const deleteStaff = async (id) => {
    if (!window.confirm("Delete this staff?")) return;
    try {
      await axios.delete(`${API_URL}/admin/staff/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaff((prev) => prev.filter((s) => s.staff_id !== id));
      toast.success("Staff deleted!");
    } catch {
      toast.error("Failed to delete staff");
    }
  };

  const deleteComplaint = async (id) => {
    if (!window.confirm("Delete this complaint?")) return;
    try {
      await axios.delete(`${API_URL}/admin/complaints/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints((prev) => prev.filter((c) => c.complaint_id !== id));
      toast.success("Complaint deleted!");
    } catch {
      toast.error("Failed to delete complaint");
    }
  };

  // ✅ Approve Staff
  const approveStaff = async (id) => {
    try {
      const res = await axios.post(
        `${API_URL}/approve-staff/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message || "Staff approved!");
      setStaff((prev) => prev.map((s) => (s.staff_id === id ? { ...s, status: "approved" } : s)));
    } catch {
      toast.error("Failed to approve staff");
    }
  };

  // ✅ Sidebar Component
  const Sidebar = () => (
    <div className="sidebar">
<img src="/Images/ruraledge-logo.png" alt="RuralEdge Logo" className="logo-img" />
      <div className="logo-title">Admin Dashboard</div>
      <ul>
        <li className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>Users</li>
        <li className={activeTab === "staff" ? "active" : ""} onClick={() => setActiveTab("staff")}>Staff</li>
        <li className={activeTab === "complaints" ? "active" : ""} onClick={() => setActiveTab("complaints")}>Complaints</li>
      </ul>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );

  // ✅ Table Renderer
  const renderTable = () => {
    if (activeTab === "users") {
      return (
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Contact</th><th>Action</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.contact_number}</td>
                <td><button className="delete-btn" onClick={() => deleteUser(u.user_id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (activeTab === "staff") {
      return (
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Department</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.staff_id}>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>{departments.find((d) => d.department_id === s.department_id)?.name || "—"}</td>
                <td>{s.status}</td>
                <td>
                  {s.status === "pending" && <button className="approve-btn" onClick={() => approveStaff(s.staff_id)}>Approve</button>}
                  <button className="delete-btn" onClick={() => deleteStaff(s.staff_id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (activeTab === "complaints") {
      const filteredComplaints = complaints.filter((c) =>
        (c.department_name || "").toLowerCase().includes(complaintSearch.toLowerCase())
      );

      return (
        <>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by department..."
              value={complaintSearch}
              onChange={(e) => setComplaintSearch(e.target.value)}
            />
          </div>
          <table>
            <thead>
              <tr>
                <th>User</th><th>Department</th><th>Issue</th><th>Reported On</th><th>Status</th>
                <th>Uploaded Image</th><th>Resolution Image</th><th>Resolution Notes</th>
                <th>Assigned Staff</th><th>Assign Task</th><th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((c) => {
                const photoUrl = c.photo_full_url || (c.photo_url ? `${API_URL}/uploads/${c.photo_url}` : null);
                const resolutionUrl = c.resolution_full_url || (c.resolution_image ? `${API_URL}/uploads/${c.resolution_image}` : null);

                return (
                  <tr key={c.complaint_id}>
                    <td>{c.user_name}</td>
                    <td>{c.department_name}</td>
                    <td>{c.issue_type}</td>
                    <td>{c.created_on?.slice(0, 10) || "—"}</td>
                    <td>{c.status}</td>
                    <td>
                      {photoUrl && <img src={photoUrl} alt="Uploaded" className="thumbnail" onClick={() => { setModalImage(photoUrl); setModalNotes(c.description || ""); }} />}
                    </td>
                    <td>
                      {resolutionUrl && <img src={resolutionUrl} alt="Resolution" className="thumbnail" onClick={() => { setModalImage(resolutionUrl); setModalNotes(c.resolution_notes || ""); }} />}
                    </td>
                    <td>{c.resolution_notes || "—"}</td>
                    <td>{c.staff_name || "-"}</td>
                    <td>
                      <select
                        value={assignments[c.complaint_id]?.assigned_staff_id || ""}
                        onChange={(e) => handleAssignmentChange(c.complaint_id, "assigned_staff_id", e.target.value)}
                      >
                        <option value="">Assign Staff</option>
                        {staff.filter((s) => s.status === "approved" && s.department_id === c.department_id).map((s) => (
                          <option key={s.staff_id} value={s.staff_id}>{s.name}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={assignments[c.complaint_id]?.scheduled_visit || ""}
                        onChange={(e) => handleAssignmentChange(c.complaint_id, "scheduled_visit", e.target.value)}
                      />
                      <button
                        className="assign-btn"
                        onClick={() =>
                          assignComplaint(
                            c.complaint_id,
                            assignments[c.complaint_id]?.assigned_staff_id,
                            assignments[c.complaint_id]?.scheduled_visit
                          )
                        }
                      >
                        Assign
                      </button>
                    </td>
                    <td><button className="delete-btn" onClick={() => deleteComplaint(c.complaint_id)}>Delete</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      );
    }
  };

  return (
    <div className="admin-dashboard">
      <ToastContainer position="top-right" autoClose={3000} />
      <Sidebar />
      <div className="admin-main">
        {renderTable()}
      </div>

      {modalImage && (
        <div className="modal" onClick={() => setModalImage(null)}>
          <img src={modalImage} alt="Full size" />
          {modalNotes && <div className="notes"><strong>Notes:</strong> {modalNotes}</div>}
        </div>
      )}

      <div className="chatbot-container">
        <Chatbot />
      </div>
    </div>
  );
};

export default AdminDashboard;
