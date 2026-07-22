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
  const [adminStats, setAdminStats] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'pending' | 'verified' | 'students' | 'events' | 'users'
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

    fetchAdminData();
  }, [user, profile, loading, navigate]);

  const fetchAdminData = async () => {
    try {
      setFetching(true);
      const [venuesRes, studentsRes, statsRes, eventsRes, usersRes] = await Promise.all([
        api.get("/admin/venues"),
        api.get("/admin/students"),
        api.get("/admin/stats"),
        api.get("/admin/events"),
        api.get("/admin/users"),
      ]);

      if (venuesRes.data?.success) setVenues(venuesRes.data.data);
      if (studentsRes.data?.success) setPendingStudents(studentsRes.data.data);
      if (statsRes.data?.success) setAdminStats(statsRes.data.data);
      if (eventsRes.data?.success) setAllEvents(eventsRes.data.data);
      if (usersRes.data?.success) setAllUsers(usersRes.data.data);
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
      toast.error("Could not load admin listings");
    } finally {
      setFetching(false);
    }
  };

  const handleToggleEvent = async (eventId, currentActive) => {
    const nextActive = !currentActive;
    try {
      const res = await api.put(`/admin/events/${eventId}/toggle`, { is_active: nextActive });
      if (res.data?.success) {
        toast.success(nextActive ? "Event is now Live 🟢" : "Event Unpublished 🔴");
        setAllEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, is_active: nextActive } : e))
        );
      }
    } catch (err) {
      toast.error("Failed to update event status");
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data?.success) {
        toast.success(`User role updated to ${newRole} 👑`);
        setAllUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      toast.error("Failed to update user role");
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

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard__main" style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}>
          <div className="squad-drawer-spinner" />
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
          <h1>Admin Control Center 👑</h1>
          <p>Platform analytics, partner venue approvals, student verification & system control</p>
        </header>

        {/* Tab Selection Bar */}
        <div className="admin-dashboard__tabs" style={{ flexWrap: "wrap", gap: "8px" }}>
          <button
            className={`admin-dashboard__tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            📊 Platform Overview
          </button>
          <button
            className={`admin-dashboard__tab ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            🏛️ Pending Venues ({venues.filter((v) => !v.is_verified).length})
          </button>
          <button
            className={`admin-dashboard__tab ${activeTab === "verified" ? "active" : ""}`}
            onClick={() => setActiveTab("verified")}
          >
            ✓ Verified Venues ({venues.filter((v) => v.is_verified).length})
          </button>
          <button
            className={`admin-dashboard__tab ${activeTab === "students" ? "active" : ""}`}
            onClick={() => setActiveTab("students")}
          >
            🎓 Student Reviews ({pendingStudents.filter(s => s.student_verification_status === "pending").length})
          </button>
          <button
            className={`admin-dashboard__tab ${activeTab === "events" ? "active" : ""}`}
            onClick={() => setActiveTab("events")}
          >
            🎟️ All Events ({allEvents.length})
          </button>
          <button
            className={`admin-dashboard__tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            👥 Users & Roles ({allUsers.length})
          </button>
        </div>

        {/* ── TAB CONTENT RENDERERS ── */}

        {/* 1. OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px", marginTop: "10px" }}>
            
            {/* KPI Cards Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
              <div className="admin-card" style={{ padding: "26px 28px", background: "rgba(125, 92, 252, 0.06)", border: "1px solid rgba(125, 92, 252, 0.25)" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--primary-light)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>💳 Gross Revenue</span>
                <h2 style={{ fontSize: "2.2rem", color: "white", margin: "10px 0 6px 0", fontWeight: 800, letterSpacing: "-0.5px" }}>
                  ₹{(adminStats?.totalRevenue || 0).toLocaleString("en-IN")}
                </h2>
                <span style={{ fontSize: "0.82rem", color: "rgba(255, 255, 255, 0.6)" }}>
                  {adminStats?.totalBookings || 0} Total Ticket Bookings
                </span>
              </div>

              <div className="admin-card" style={{ padding: "26px 28px", background: "rgba(255, 0, 127, 0.06)", border: "1px solid rgba(255, 0, 127, 0.25)" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--accent-pink)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>🏛️ Partner Venues</span>
                <h2 style={{ fontSize: "2.2rem", color: "white", margin: "10px 0 6px 0", fontWeight: 800, letterSpacing: "-0.5px" }}>
                  {adminStats?.totalVenues || 0}
                </h2>
                <span style={{ fontSize: "0.82rem", color: "#f59e0b", fontWeight: 600 }}>
                  {adminStats?.pendingVenues || 0} Pending Approvals
                </span>
              </div>

              <div className="admin-card" style={{ padding: "26px 28px", background: "rgba(0, 255, 170, 0.06)", border: "1px solid rgba(0, 255, 170, 0.25)" }}>
                <span style={{ fontSize: "0.78rem", color: "#00ffaa", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>🎟️ Platform Events</span>
                <h2 style={{ fontSize: "2.2rem", color: "white", margin: "10px 0 6px 0", fontWeight: 800, letterSpacing: "-0.5px" }}>
                  {adminStats?.totalEvents || 0}
                </h2>
                <span style={{ fontSize: "0.82rem", color: "#10b981", fontWeight: 600 }}>
                  {adminStats?.activeEvents || 0} Currently Live
                </span>
              </div>

              <div className="admin-card" style={{ padding: "26px 28px", background: "rgba(59, 130, 246, 0.06)", border: "1px solid rgba(59, 130, 246, 0.25)" }}>
                <span style={{ fontSize: "0.78rem", color: "#60a5fa", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>👥 Users & Students</span>
                <h2 style={{ fontSize: "2.2rem", color: "white", margin: "10px 0 6px 0", fontWeight: 800, letterSpacing: "-0.5px" }}>
                  {adminStats?.totalUsers || 0}
                </h2>
                <span style={{ fontSize: "0.82rem", color: "#f59e0b", fontWeight: 600 }}>
                  {adminStats?.pendingStudents || 0} Student Reviews Pending
                </span>
              </div>
            </div>

            {/* Quick Management Actions Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "28px" }}>
              
              {/* Left Box: Quick Actions */}
              <div className="admin-card" style={{ padding: "32px" }}>
                <h3 style={{ fontSize: "1.2rem", color: "white", margin: "0 0 20px 0", fontWeight: 800 }}>
                  ⚡ Quick Administrative Tasks
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <button 
                    onClick={() => setActiveTab("pending")} 
                    className="admin-dashboard__tab active"
                    style={{ textAlign: "left", justifyContent: "space-between", display: "flex", padding: "14px 20px" }}
                  >
                    <span>🏛️ Review Pending Venues</span>
                    <span style={{ background: "rgba(255,255,255,0.18)", padding: "4px 12px", borderRadius: "10px", fontSize: "0.82rem" }}>
                      {venues.filter((v) => !v.is_verified).length} Waiting
                    </span>
                  </button>

                  <button 
                    onClick={() => setActiveTab("students")} 
                    className="admin-dashboard__tab"
                    style={{ textAlign: "left", justifyContent: "space-between", display: "flex", padding: "14px 20px" }}
                  >
                    <span>🎓 Review Student College IDs</span>
                    <span style={{ background: "rgba(255,255,255,0.08)", padding: "4px 12px", borderRadius: "10px", fontSize: "0.82rem" }}>
                      {pendingStudents.filter(s => s.student_verification_status === "pending").length} Waiting
                    </span>
                  </button>

                  <button 
                    onClick={() => setActiveTab("events")} 
                    className="admin-dashboard__tab"
                    style={{ textAlign: "left", justifyContent: "space-between", display: "flex", padding: "14px 20px" }}
                  >
                    <span>🎟️ Manage Platform Events</span>
                    <span style={{ background: "rgba(255,255,255,0.08)", padding: "4px 12px", borderRadius: "10px", fontSize: "0.82rem" }}>
                      {allEvents.length} Events
                    </span>
                  </button>

                  <button 
                    onClick={() => setActiveTab("users")} 
                    className="admin-dashboard__tab"
                    style={{ textAlign: "left", justifyContent: "space-between", display: "flex", padding: "14px 20px" }}
                  >
                    <span>👥 Manage User Accounts & Roles</span>
                    <span style={{ background: "rgba(255,255,255,0.08)", padding: "4px 12px", borderRadius: "10px", fontSize: "0.82rem" }}>
                      {allUsers.length} Users
                    </span>
                  </button>
                </div>
              </div>

              {/* Right Box: Recent Activity Log */}
              <div className="admin-card" style={{ padding: "32px" }}>
                <h3 style={{ fontSize: "1.2rem", color: "white", margin: "0 0 20px 0", fontWeight: 800 }}>
                  📜 Recent Ticket Activity
                </h3>
                {adminStats?.recentBookings?.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>No recent bookings recorded.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {(adminStats?.recentBookings || []).map((b) => (
                      <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", background: "rgba(255,255,255,0.03)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div>
                          <strong style={{ color: "white", fontSize: "0.92rem", display: "block" }}>{b.event?.title || "Party Ticket"}</strong>
                          <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>By {b.user?.full_name || "Customer"}</span>
                        </div>
                        <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--success)" }}>
                          ₹{b.total_amount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* 2. ALL EVENTS TAB */}
        {activeTab === "events" && (
          <div style={{ marginTop: "24px" }}>
            {allEvents.length === 0 ? (
              <div className="admin-dashboard__empty">
                <h3>No events found</h3>
              </div>
            ) : (
              <div className="admin-dashboard__grid">
                {allEvents.map((evt) => (
                  <div key={evt.id} className="admin-card" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <img 
                      src={evt.poster_url || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300"} 
                      alt={evt.title}
                      style={{ width: "70px", height: "70px", borderRadius: "12px", objectFit: "cover" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: 0, color: "white", fontSize: "1rem", fontWeight: 700 }}>{evt.title}</h3>
                      <p style={{ margin: "4px 0", fontSize: "0.78rem", color: "hsl(var(--muted))" }}>
                        📍 {evt.venue?.name || "Venue"} • {evt.venue?.city}
                      </p>
                      <span style={{ fontSize: "0.75rem", color: evt.is_active ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                        {evt.is_active ? "🟢 Live & Active" : "🔴 Unpublished"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`admin-card__btn ${evt.is_active ? "reject" : "approve"}`}
                      onClick={() => handleToggleEvent(evt.id, evt.is_active)}
                    >
                      {evt.is_active ? "Disable Event" : "Publish Event"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. USERS & ROLES TAB */}
        {activeTab === "users" && (
          <div style={{ marginTop: "24px" }}>
            {allUsers.length === 0 ? (
              <div className="admin-dashboard__empty">
                <h3>No users found</h3>
              </div>
            ) : (
              <div className="admin-dashboard__grid">
                {allUsers.map((u) => {
                  const initial = (u.full_name || u.email || "U")[0].toUpperCase();
                  return (
                    <div key={u.id} className="admin-user-card">
                      {/* User Header */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "1rem", flexShrink: 0, boxShadow: "0 0 12px rgba(125, 92, 252, 0.3)" }}>
                          {initial}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                          <h3 style={{ margin: 0, color: "white", fontSize: "0.98rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {u.full_name || "User"}
                          </h3>
                          <span style={{ fontSize: "0.78rem", color: "hsl(var(--muted))", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {u.email}
                          </span>
                        </div>
                      </div>

                      {/* Badges */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span className={`admin-user-role-badge role-${u.role || "customer"}`}>
                          Role: {u.role?.toUpperCase() || "CUSTOMER"}
                        </span>
                        {u.is_student && (
                          <span className="admin-user-student-badge">
                            🎓 Verified Student
                          </span>
                        )}
                      </div>

                      {/* Action Selector */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "4px" }}>
                        <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted))", fontWeight: 600 }}>Set System Role:</span>
                        <select 
                          value={u.role || "customer"}
                          onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                          className="admin-role-select"
                        >
                          <option value="customer">Customer 👤</option>
                          <option value="venue_owner">Venue Owner 🏛️</option>
                          <option value="admin">Admin 👑</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. STUDENTS TAB */}
        {activeTab === "students" && (
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
        )}

        {/* 5. PENDING & VERIFIED VENUES TABS */}
        {(activeTab === "pending" || activeTab === "verified") && (
          filteredVenues.length === 0 ? (
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
        ))}
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
