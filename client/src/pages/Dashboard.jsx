import { useState, useEffect } from "react";
import { HiBuildingStorefront, HiCalendarDays, HiListBullet, HiArrowLeftOnRectangle } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import MyVenue from "../components/dashboard/MyVenue";
import CreateEvent from "../components/dashboard/CreateEvent";
import toast from "react-hot-toast";
import "./Dashboard.css";

function Dashboard() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("venue");

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/owner/login");
      return;
    }

    if (profile && profile.role !== "venue_owner" && profile.role !== "admin") {
      navigate("/");
      toast.error("Access denied. Partner Portal is for venue owners only.");
      return;
    }

    // Check if venue exists — redirect to setup if not
    const checkVenue = async () => {
      const { data: venue } = await supabase
        .from("venues")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!venue) {
        navigate("/owner/setup");
      }
    };
    checkVenue();
  }, [user, profile, loading, navigate]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate("/owner/login");
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  if (loading) {
    return <div className="dashboard-page"><p style={{ color: "white", padding: "40px" }}>Loading...</p></div>;
  }

  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar__brand">
          <span className="dashboard-sidebar__logo">AD</span>
          <span className="dashboard-sidebar__brand-text">AfterDark Owner</span>
        </div>

        <nav className="dashboard-sidebar__nav">
          <button
            className={`dashboard-sidebar__nav-item ${activeTab === "venue" ? "active" : ""}`}
            onClick={() => setActiveTab("venue")}
          >
            <HiBuildingStorefront />
            <span>My Venue</span>
          </button>

          <button
            className={`dashboard-sidebar__nav-item ${activeTab === "create-event" ? "active" : ""}`}
            onClick={() => setActiveTab("create-event")}
          >
            <HiCalendarDays />
            <span>Create Event</span>
          </button>

          <button
            className={`dashboard-sidebar__nav-item ${activeTab === "events" ? "active" : ""}`}
            onClick={() => setActiveTab("events")}
          >
            <HiListBullet />
            <span>My Events</span>
          </button>
        </nav>

        <div className="dashboard-sidebar__footer">
          <button className="dashboard-sidebar__logout" onClick={handleLogout}>
            <HiArrowLeftOnRectangle />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {activeTab === "venue" && <MyVenue />}
        {activeTab === "create-event" && <CreateEvent />}
        {activeTab === "events" && (
          <div className="dashboard-placeholder">
            <h2>My Events</h2>
            <p>Coming soon — manage all your events here.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
