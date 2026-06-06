import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import "./App.css";

// 🧠 LEARN: React Router
// BrowserRouter — wraps your app to enable routing
// Routes — container for all your route definitions
// Route — maps a URL path to a component
//
// When user visits "/", React renders <Home />
// When user visits "/events/123", React renders <EventDetail />
// No page reload! React swaps components instantly. This is called SPA (Single Page App)

function App() {
  return (
    <Router>
      {/* Toast notifications — shows success/error messages anywhere in the app */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1a1a2e",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />

        {/* TODO: Day 4 — Auth Pages */}
        {/* <Route path="/login" element={<Login />} /> */}
        {/* <Route path="/signup" element={<Signup />} /> */}

        {/* TODO: Day 7 — Event Pages */}
        {/* <Route path="/events/:id" element={<EventDetail />} /> */}

        {/* TODO: Day 9 — Venue Pages */}
        {/* <Route path="/venues/:id" element={<VenueDetail />} /> */}

        {/* TODO: Day 12 — Booking Pages */}
        {/* <Route path="/bookings" element={<MyBookings />} /> */}

        {/* TODO: Day 16 — Squad Pages */}
        {/* <Route path="/squads" element={<MySquads />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
