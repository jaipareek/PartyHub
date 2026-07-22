import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HiBuildingStorefront, HiCheck, HiArrowLeftOnRectangle } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import api from "../lib/api";
import toast from "react-hot-toast";
import "./VenueSetup.css";

const CATEGORIES = [
  { value: "club", label: "Club" },
  { value: "cafe", label: "Café" },
  { value: "bar", label: "Bar" },
  { value: "restaurant", label: "Restaurant" },
  { value: "concert_hall", label: "Concert Hall" },
  { value: "outdoor", label: "Outdoor" },
  { value: "other", label: "Other" },
];

const AMENITIES_LIST = [
  "VIP Lounge", "Full Bar", "Rooftop", "Live DJ", "Dance Floor",
  "Parking", "Smoking Zone", "AC", "Outdoor Seating", "Karaoke",
  "Pool Table", "Food Menu", "Wi-Fi", "Private Rooms",
];

function VenueSetup() {
  const { user, signOut, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("club");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
  const [venueEmail, setVenueEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [openTime, setOpenTime] = useState("18:00");
  const [closeTime, setCloseTime] = useState("02:00");
  const [imageUrl, setImageUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState("");
  const [amenities, setAmenities] = useState([]);

  const toggleAmenity = (a) => {
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out 👋");
    navigate("/owner/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !address || !city) {
      toast.error("Venue Name, Address, and City are required");
      return;
    }

    try {
      setLoading(true);

      const parsedGallery = galleryUrls
        .split(",")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      const finalImages = [];
      if (imageUrl.trim()) finalImages.push(imageUrl.trim());
      parsedGallery.forEach((g) => {
        if (!finalImages.includes(g)) finalImages.push(g);
      });

      if (finalImages.length === 0) {
        finalImages.push("https://images.unsplash.com/photo-1566417713940-fe7c8460ffd3?w=1200");
      }

      await api.post("/venues", {
        name, description, category, address, city, state,
        phone, email: venueEmail, website,
        opening_time: openTime ? `${openTime}:00` : null,
        closing_time: closeTime ? `${closeTime}:00` : null,
        images: finalImages,
        amenities,
      });

      // Set role to venue_owner in profiles table
      await supabase
        .from("profiles")
        .update({ role: "venue_owner" })
        .eq("id", user.id);

      await fetchProfile(user.id);
      toast.success("Venue registered! Welcome to the Partner Portal 🎉");
      navigate("/owner/dashboard");
    } catch (err) {
      console.error("Setup error:", err);
      toast.error(err.response?.data?.error || err.message || "Failed to save venue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-page">
      <div className="setup-page__glow setup-page__glow--1" />
      <div className="setup-page__glow setup-page__glow--2" />

      <motion.div
        className="setup-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="setup-card__header">
          <div className="setup-card__logo-wrap">
            <HiBuildingStorefront className="setup-card__logo-icon" />
          </div>
          <h1 className="setup-card__title">Register your <em>venue</em></h1>
          <p className="setup-card__subtitle">
            Enter your business details to complete your registration as an AfterDark Partner.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          {/* General Info */}
          <div className="setup-section">
            <h3>🏢 General Information</h3>
            <div className="setup-grid">
              <div className="setup-field">
                <label>Venue Name *</label>
                <input type="text" placeholder="e.g., Skyline Arena" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="setup-field">
                <label>Category *</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="setup-field col-span-2">
                <label>Description</label>
                <textarea rows={3} placeholder="Music genres, dress codes, vibe..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="setup-section">
            <h3>📍 Location & Timings</h3>
            <div className="setup-grid">
              <div className="setup-field col-span-2">
                <label>Street Address *</label>
                <input type="text" placeholder="e.g., 100ft Road, Indiranagar" value={address} onChange={(e) => setAddress(e.target.value)} required />
              </div>
              <div className="setup-field">
                <label>City *</label>
                <input type="text" placeholder="e.g., Bangalore" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
              <div className="setup-field">
                <label>State</label>
                <input type="text" placeholder="e.g., Karnataka" value={state} onChange={(e) => setState(e.target.value)} />
              </div>
              <div className="setup-field">
                <label>Opening Time</label>
                <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
              </div>
              <div className="setup-field">
                <label>Closing Time</label>
                <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="setup-section">
            <h3>📞 Contact & Branding</h3>
            <div className="setup-grid">
              <div className="setup-field">
                <label>Phone</label>
                <input type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="setup-field">
                <label>Email</label>
                <input type="email" placeholder="booking@skyline.com" value={venueEmail} onChange={(e) => setVenueEmail(e.target.value)} />
              </div>
              <div className="setup-field col-span-2">
                <label>Website URL</label>
                <input type="url" placeholder="https://skyline.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>
              <div className="setup-field col-span-2">
                <label>Main Cover Photo URL</label>
                <input type="url" placeholder="https://images.unsplash.com/photo-main..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              </div>
              <div className="setup-field col-span-2">
                <label>Additional Gallery Photo URLs (Comma-Separated)</label>
                <input type="text" placeholder="https://images.../photo1.jpg, https://images.../photo2.jpg" value={galleryUrls} onChange={(e) => setGalleryUrls(e.target.value)} />
                <span style={{ fontSize: "0.72rem", color: "hsl(var(--muted))", marginTop: "4px", display: "block" }}>
                  💡 Add multiple photo URLs separated by commas for your venue gallery (interior, VIP lounge, stage, bar).
                </span>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="setup-section">
            <h3>✨ Amenities</h3>
            <div className="setup-amenities">
              {AMENITIES_LIST.map((a) => (
                <label key={a} className={`setup-amenity ${amenities.includes(a) ? "active" : ""}`}>
                  <input type="checkbox" checked={amenities.includes(a)} onChange={() => toggleAmenity(a)} />
                  <span>{a}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="setup-actions">
            <button type="button" className="setup-btn setup-btn--ghost" onClick={handleLogout}>
              <HiArrowLeftOnRectangle /> Sign Out
            </button>
            <button type="submit" className="setup-btn setup-btn--primary" disabled={loading}>
              {loading ? "Registering..." : <><HiCheck /> Complete Setup</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default VenueSetup;
