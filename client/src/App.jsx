import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/layout/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import EventDetail from "./pages/EventDetail";
import Events from "./pages/Events";
import LoadingScreen from "./components/ui/LoadingScreen";
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

        {/* Navbar */}
        <Navbar />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* ✅ Day 8 — Events Search & Filters */}
          <Route path="/events" element={<Events />} />

          {/* ✅ Day 7 — Event Detail */}
          <Route path="/events/:id" element={<EventDetail />} />

          {/* TODO: Day 6 — Venue Detail */}
          {/* <Route path="/venues/:id" element={<VenueDetail />} /> */}
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
