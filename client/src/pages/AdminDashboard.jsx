import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";
import "./AdminDashboard.css";

function AdminDashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  
  const [venues, setVenues] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    if (profile?.role !== "admin") {
      navigate("/");
      toast.error("Access denied. Admin portal only.");
      return;
    }

    fetchVenuesAndStudents();
  }, [user, profile, loading, navigate]);

  const fetchVenuesAndStudents = async () => {
    try {
      setFetching(true);
      const venuesRes = await api.get("/admin/venues");
      if (venuesRes.data?.success) {
        setVenues(venuesRes.data.data);
      }
      const studentsRes = await api.get("/admin/students");
      if (studentsRes.data?.success) {
        setPendingStudents(studentsRes.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
      toast.error("Could not load admin listings");
    } finally {
      setFetching(false);
    }
  };

  const handleVerifyToggle = async (venueId, currentStatus) => {
    const nextStatus = !currentStatus;
    const toastId = toast.loading(nextStatus ? "Approving venue..." : "Revoking verification...");
    
    try {
      const res = await api.put(`/admin/venues/${venueId}/verify`, {
        is_verified: nextStatus,
      });

      if (res.data?.success) {
        toast.success(nextStatus ? "Venue approved successfully! 🎉" : "Verification status revoked.", { id: toastId });
        // Update local state
        setVenues((prev) =>
          prev.map((v) => (v.id === venueId ? { ...v, is_verified: nextStatus } : v))
        );
      }
    } catch (err) {
      console.error("Verification update failed:", err);
      toast.error("Failed to update verification status", { id: toastId });
    }
  };

  const handleVerifyStudent = async (profileId, status) => {
    const toastId = toast.loading(status === "approved" ? "Approving student..." : "Rejecting request...");
    
    try {
      const res = await api.put(`/admin/students/${profileId}/verify`, {
        status,
      });

      if (res.data?.success) {
        toast.success(status === "approved" ? "Student approved successfully! 🎓" : "Verification request rejected.", { id: toastId });
        // Update local state
        setPendingStudents((prev) => prev.filter((s) => s.id !== profileId));
      }
    } catch (err) {
      console.error("Student verification failed:", err);
      toast.error("Failed to update student status", { id: toastId });
    }
  };

  if (loading || fetching) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard__main">
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const filteredVenues = venues.filter((v) =>
    activeTab === "pending" ? !v.is_verified : v.is_verified
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__main">
        <header className="admin-dashboard__header">
          <h1>Admin Portal</h1>
          <p>Review and verify partner venue registrations</p>
        </header>

        {/* Tab Selection */}
        <div className="admin-dashboard__tabs">
          <button
            className={`admin-dashboard__tab ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            Pending Venues ({venues.filter((v) => !v.is_verified).length})
          </button>
          <button
            className={`admin-dashboard__tab ${activeTab === "verified" ? "active" : ""}`}
            onClick={() => setActiveTab("verified")}
          >
            Verified Venues ({venues.filter((v) => v.is_verified).length})
          </button>
          <button
            className={`admin-dashboard__tab ${activeTab === "students" ? "active" : ""}`}
            onClick={() => setActiveTab("students")}
          >
            Student Reviews ({pendingStudents.length})
          </button>
        </div>

        {/* Grid List */}
        {activeTab === "students" ? (
          pendingStudents.length === 0 ? (
            <div className="admin-dashboard__empty">
              <h3>No student verification requests</h3>
              <p>All student documents have been processed.</p>
            </div>
          ) : (
            <div className="admin-dashboard__grid">
              {pendingStudents.map((student) => (
                <div key={student.id} className="admin-card">
                  <h3 className="admin-card__title">{student.full_name}</h3>
                  
                  <div className="admin-card__info-group">
                    <div className="admin-card__info-item">
                      <span className="admin-card__info-label">Email Address</span>
                      <span className="admin-card__info-val">{student.email}</span>
                    </div>
                    
                    <div className="admin-card__info-item">
                      <span className="admin-card__info-label">College / University</span>
                      <span className="admin-card__info-val">{student.college || "Not declared"}</span>
                    </div>

                    <div className="admin-card__info-item">
                      <span className="admin-card__info-label">Student ID Proof</span>
                      <span className="admin-card__info-val">
                        {student.student_id_url ? (
                          <a href={student.student_id_url} target="_blank" rel="noreferrer" style={{ color: "var(--primary-light)", textDecoration: "underline" }}>
                            View ID Card Scan ↗
                          </a>
                        ) : "None provided"}
                      </span>
                    </div>

                    <div className="admin-card__info-item">
                      <span className="admin-card__info-label">Aadhaar Proof</span>
                      <span className="admin-card__info-val">
                        {student.aadhar_url ? (
                          <a href={student.aadhar_url} target="_blank" rel="noreferrer" style={{ color: "var(--primary-light)", textDecoration: "underline" }}>
                            View Aadhaar Document ↗
                          </a>
                        ) : "None provided"}
                      </span>
                    </div>
                  </div>

                  <div className="admin-card__actions" style={{ gap: "10px", marginTop: "20px" }}>
                    <button
                      className="admin-btn admin-btn--approve"
                      style={{ flex: 1 }}
                      onClick={() => handleVerifyStudent(student.id, "approved")}
                    >
                      Approve Student
                    </button>
                    <button
                      className="admin-btn admin-btn--revoke"
                      style={{ flex: 1 }}
                      onClick={() => handleVerifyStudent(student.id, "rejected")}
                    >
                      Reject Request
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredVenues.length === 0 ? (
          <div className="admin-dashboard__empty">
            <h3>No venues found</h3>
            <p>There are currently no venues in this category.</p>
          </div>
        ) : (
          <div className="admin-dashboard__grid">
            {filteredVenues.map((venue) => (
              <div key={venue.id} className="admin-card">
                <h3 className="admin-card__title">{venue.name}</h3>

                <div className="admin-card__info-group">
                  <div className="admin-card__info-item">
                    <span className="admin-card__info-label">Address</span>
                    <span className="admin-card__info-val">
                      {venue.address}, {venue.city}
                    </span>
                  </div>

                  <div className="admin-card__info-item">
                    <span className="admin-card__info-label">Owner Profile</span>
                    <span className="admin-card__info-val">
                      {venue.owner?.full_name || "Unknown"} ({venue.owner?.email || "No email"})
                    </span>
                  </div>

                  <div className="admin-card__info-item">
                    <span className="admin-card__info-label">Phone</span>
                    <span className="admin-card__info-val">{venue.phone || "Not provided"}</span>
                  </div>

                  <div className="admin-card__info-item">
                    <span className="admin-card__info-label">Business Reg No</span>
                    <span className="admin-card__info-val">
                      {venue.business_reg_no || "Not provided"}
                    </span>
                  </div>

                  <div className="admin-card__info-item">
                    <span className="admin-card__info-label">ID Proof Info</span>
                    <span className="admin-card__info-val">
                      {venue.id_proof || "Not provided"}
                    </span>
                  </div>
                </div>

                <div className="admin-card__actions">
                  {venue.is_verified ? (
                    <button
                      className="admin-btn admin-btn--revoke"
                      onClick={() => handleVerifyToggle(venue.id, venue.is_verified)}
                    >
                      Revoke Approval
                    </button>
                  ) : (
                    <button
                      className="admin-btn admin-btn--approve"
                      onClick={() => handleVerifyToggle(venue.id, venue.is_verified)}
                    >
                      Approve Venue
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
