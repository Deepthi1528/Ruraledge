import React, { useEffect, useState } from "react";
import axios from "axios";

const MyComplaints = ({ userId }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .get(`${process.env.REACT_APP_API_URL}/user/${userId}/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setComplaints(res.data))
      .catch((err) => {
        console.error("Failed to load complaints", err);
        alert("Failed to load complaints");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <p>Loading your complaints...</p>;

  return (
    <section className="complaints-section">
      <h2>My Complaints</h2>
      <div className="table-container">
        <table className="complaints-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Issue</th>
              <th>Location</th>
              <th>Department</th>
              <th>Status</th>
              <th>Assigned Staff</th>
              <th>Resolution Notes</th>
              <th>Resolution Image</th>
            </tr>
          </thead>
          <tbody>
            {complaints.length > 0 ? (
              complaints.map((c) => (
                <tr key={c.complaint_id}>
                  <td>#{c.complaint_id.slice(0, 5)}</td>
                  <td>{c.issue_type}</td>
                  <td>{c.location}</td>
                  <td>{c.department_name}</td>
                  <td>
                    <span
                      className={`status-badge ${c.status
                        ?.replace(/\s+/g, "-")
                        .toLowerCase()}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td>{c.staff_name || "—"}</td>
                  <td>{c.resolution_notes || "—"}</td>
                  <td>
                    {c.resolution_image ? (
                      <img
                        src={`${process.env.REACT_APP_API_URL}${c.resolution_image}`}
                        alt="Resolution"
                        style={{
                          width: "60px",
                          height: "60px",
                          objectFit: "cover",
                          borderRadius: "6px",
                        }}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  No complaints submitted yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default MyComplaints;
