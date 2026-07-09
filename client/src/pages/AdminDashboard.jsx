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

    fetchVenues();
  }, [user, profile, loading, navigate]);

  const fetchVenues = async () => {
    try {
      setFetching(true);
      const res = await api.get("/admin/venues");
      if (res.data?.success) {
        setVenues(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch venues:", err);
      toast.error("Could not load venues list");
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
            Pending Approval ({venues.filter((v) => !v.is_verified).length})
          </button>
          <button
            className={`admin-dashboard__tab ${activeTab === "verified" ? "active" : ""}`}
            onClick={() => setActiveTab("verified")}
          >
            Verified Partners ({venues.filter((v) => v.is_verified).length})
          </button>
        </div>

        {/* Grid List */}
        {filteredVenues.length === 0 ? (
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
