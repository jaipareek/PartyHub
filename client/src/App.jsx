import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/layout/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import LoginGate from "./pages/LoginGate";
import SignupGate from "./pages/SignupGate";
import EventDetail from "./pages/EventDetail";
import Events from "./pages/Events";
import Venues from "./pages/Venues";
import VenueDetail from "./pages/VenueDetail";
import OwnerLogin from "./pages/OwnerLogin";
import OwnerSignup from "./pages/OwnerSignup";
import VenueSetup from "./pages/VenueSetup";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import MyBookings from "./pages/MyBookings";
import SquadDetail from "./pages/SquadDetail";
import UserProfile from "./pages/UserProfile";
import AuthCallback from "./pages/AuthCallback";
import GateCheckIn from "./pages/GateCheckIn";
import LoadingScreen from "./components/ui/LoadingScreen";
import PartyBackground from "./components/ui/PartyBackground";
import "./App.css";

function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Router>
      <AuthProvider>
        {/* Loading Screen */}
        {isLoading && (
          <LoadingScreen onComplete={() => setIsLoading(false)} />
        )}

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "hsl(240 20% 8%)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
            },
          }}
        />

        {/* 🎆 Persistent Animated Party Background */}
        <PartyBackground />

        {/* Navbar */}
        <Navbar />

        <div style={{ position: 'relative', zIndex: 1 }}>

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginGate />} />
          <Route path="/login/user" element={<Login />} />
          <Route path="/signup" element={<SignupGate />} />
          <Route path="/signup/user" element={<Signup />} />

          {/* OAuth Callback */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Events & Venues (public) */}
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/venues" element={<Venues />} />
          <Route path="/venues/:id" element={<VenueDetail />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/squads/:squadId" element={<SquadDetail />} />
          <Route path="/profile" element={<UserProfile />} />

          {/* Venue Owner Auth */}
          <Route path="/owner/login" element={<OwnerLogin />} />
          <Route path="/owner/signup" element={<OwnerSignup />} />
          <Route path="/owner/setup" element={<VenueSetup />} />
          <Route path="/owner/dashboard" element={<Dashboard />} />
          <Route path="/owner/check-in/:code" element={<GateCheckIn />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
