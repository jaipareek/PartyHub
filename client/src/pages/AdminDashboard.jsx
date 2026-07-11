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
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");

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
    const toastId = toast.loading(status === "approved" ? "Approving student..." : "Updating status...");
    
    try {
      const res = await api.put(`/admin/students/${profileId}/verify`, {
        status,
      });

      if (res.data?.success) {
        toast.success(status === "approved" ? "Student approved successfully! 🎓" : "Student status rejected/revoked.", { id: toastId });
        // Update local status inline
        setPendingStudents((prev) =>
          prev.map((s) => (s.id === profileId ? { ...s, student_verification_status: status } : s))
        );
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
                  <h3 className="admin-card__title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: "8px" }}>
                    <span>{student.full_name}</span>
                    <span style={{ 
                      fontSize: "0.68rem", 
                      fontWeight: 700, 
                      textTransform: "uppercase", 
                      borderRadius: "6px", 
                      padding: "4px 8px",
                      background: student.student_verification_status === "approved" 
                        ? "rgba(16, 185, 129, 0.12)" 
                        : student.student_verification_status === "rejected" 
                        ? "rgba(239, 68, 68, 0.12)" 
                        : "rgba(245, 158, 11, 0.12)",
                      color: student.student_verification_status === "approved" 
                        ? "#10b981" 
                        : student.student_verification_status === "rejected" 
                        ? "#ef4444" 
                        : "var(--warning)",
                      border: student.student_verification_status === "approved" 
                        ? "1px solid rgba(16, 185, 129, 0.2)" 
                        : student.student_verification_status === "rejected" 
                        ? "1px solid rgba(239, 68, 68, 0.2)" 
                        : "1px solid rgba(245, 158, 11, 0.2)"
                    }}>
                      {student.student_verification_status === "approved" 
                        ? "Approved" 
                        : student.student_verification_status === "rejected" 
                        ? "Rejected" 
                        : "Pending"}
                    </span>
                  </h3>
                  
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
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewUrl(student.student_id_url);
                              setPreviewTitle(`${student.full_name}'s Student ID`);
                            }}
                            style={{ background: "none", border: "none", color: "var(--primary-light)", textDecoration: "underline", cursor: "pointer", padding: 0, fontWeight: 600, fontSize: "inherit" }}
                          >
                            View ID Card Scan ↗
                          </button>
                        ) : "None provided"}
                      </span>
                    </div>

                    <div className="admin-card__info-item">
                      <span className="admin-card__info-label">Aadhaar Proof</span>
                      <span className="admin-card__info-val">
                        {student.aadhar_url ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewUrl(student.aadhar_url);
                              setPreviewTitle(`${student.full_name}'s Aadhaar Document`);
                            }}
                            style={{ background: "none", border: "none", color: "var(--primary-light)", textDecoration: "underline", cursor: "pointer", padding: 0, fontWeight: 600, fontSize: "inherit" }}
                          >
                            View Aadhaar Document ↗
                          </button>
                        ) : "None provided"}
                      </span>
                    </div>
                  </div>

                  <div className="admin-card__actions" style={{ gap: "10px", marginTop: "20px" }}>
                    {student.student_verification_status === "approved" ? (
                      <button
                        className="admin-btn admin-btn--revoke"
                        style={{ flex: 1 }}
                        onClick={() => handleVerifyStudent(student.id, "rejected")}
                      >
                        Revoke Approval
                      </button>
                    ) : student.student_verification_status === "rejected" ? (
                      <button
                        className="admin-btn admin-btn--approve"
                        style={{ flex: 1 }}
                        onClick={() => handleVerifyStudent(student.id, "approved")}
                      >
                        Approve Student
                      </button>
                    ) : (
                      <>
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
                      </>
                    )}
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

      {/* Glassmorphic Document Preview Modal */}
      {previewUrl && (
        <div 
          className="admin-preview-modal" 
          onClick={() => setPreviewUrl(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: "20px" }}
        >
          <div 
            className="admin-preview-modal__content" 
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#0d0d12", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px", maxWidth: "600px", width: "100%", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", position: "relative" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "white" }}>{previewTitle}</h3>
              <button 
                onClick={() => setPreviewUrl(null)}
                style={{ background: "none", border: "none", color: "hsl(var(--muted))", fontSize: "1.5rem", cursor: "pointer", transition: "color 0.2s" }}
                onMouseEnter={(e) => e.target.style.color = "white"}
                onMouseLeave={(e) => e.target.style.color = "hsl(var(--muted))"}
              >
                &times;
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
              {previewUrl.startsWith("data:application/pdf") ? (
                <iframe src={previewUrl} title="Document Preview" width="100%" height="450px" style={{ border: "none", borderRadius: "8px" }} />
              ) : (
                <img 
                  src={previewUrl} 
                  alt="Document Preview" 
                  style={{ maxWidth: "100%", maxHeight: "60vh", objectFit: "contain", borderRadius: "8px" }} 
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
