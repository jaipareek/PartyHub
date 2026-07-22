import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { 
  HiPencil, 
  HiCheck, 
  HiXMark, 
  HiBuildingStorefront, 
  HiMapPin, 
  HiPhone, 
  HiEnvelope, 
  HiGlobeAlt, 
  HiSparkles,
  HiClock
} from "react-icons/hi2";

const CATEGORIES = [
  { value: "club", label: "Club 🍾" },
  { value: "bar", label: "Bar 🍸" },
  { value: "cafe", label: "Café ☕" },
  { value: "restaurant", label: "Restaurant 🍽️" },
  { value: "concert_hall", label: "Concert Hall 🎵" },
  { value: "outdoor", label: "Outdoor Area ⛺" },
  { value: "other", label: "Other Setup 🌟" },
];

const AMENITY_ICONS = {
  "Air Conditioned": "❄️",
  "AC": "❄️",
  "Full Bar": "🍸",
  "VIP Lounge": "👑",
  "VIP Lounges": "👑",
  "Live DJ": "🎧",
  "Live DJ Setup": "🎧",
  "Dance Floor": "💃",
  "Large Dance Floor": "💃",
  "Parking": "🅿️",
  "Parking Available": "🅿️",
  "Smoking Zone": "🚬",
  "Wi-Fi": "📶",
  "Coat Check": "🧥",
  "Security": "🛡️",
  "Food & Beverages": "🍔",
  "Washrooms": "🚻",
  "Rooftop": "🌃",
  "Outdoor Seating": "🪑",
  "Karaoke": "🎤",
  "Pool Table": "🎱",
  "Food Menu": "🍕",
  "Private Rooms": "🚪",
};

function MyVenue() {
  const { user } = useAuth();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  const [mainCoverUrl, setMainCoverUrl] = useState("");
  const [galleryUrlsStr, setGalleryUrlsStr] = useState("");

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const res = await api.get("/owner/profile");
        if (res.data.data.venue) {
          const v = res.data.data.venue;
          setVenue(v);
          setForm(v);
          if (v.images && v.images.length > 0) {
            setMainCoverUrl(v.images[0] || "");
            setGalleryUrlsStr(v.images.slice(1).join(", "));
          }
        }
      } catch (err) {
        console.error("Error fetching venue:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVenue();
  }, []);

  const handleSave = async () => {
    try {
      const parsedGallery = (galleryUrlsStr || "")
        .split(",")
        .map((u) => u.trim())
        .filter((u) => u.length > 0);

      const finalImages = [];
      if (mainCoverUrl.trim()) finalImages.push(mainCoverUrl.trim());
      parsedGallery.forEach((g) => {
        if (!finalImages.includes(g)) finalImages.push(g);
      });

      const res = await api.put(`/venues/${venue.id}`, {
        name: form.name,
        description: form.description,
        category: form.category,
        address: form.address,
        city: form.city,
        state: form.state,
        phone: form.phone,
        email: form.email,
        website: form.website,
        images: finalImages.length ? finalImages : venue.images,
      });
      setVenue(res.data.data);
      setForm(res.data.data);
      if (res.data.data?.images) {
        setMainCoverUrl(res.data.data.images[0] || "");
        setGalleryUrlsStr(res.data.data.images.slice(1).join(", "));
      }
      setEditing(false);
      toast.success("Venue profile & gallery updated! 🏠");
    } catch (err) {
      toast.error("Failed to update venue profile");
    }
  };

  const getCategoryLabel = (val) => {
    const matched = CATEGORIES.find((c) => c.value === val);
    return matched ? matched.label : val;
  };

  if (loading) return <div className="dashboard-placeholder"><div className="venue-detail__loading-spinner" style={{ margin: "0 auto" }} /></div>;
  if (!venue) return <div className="dashboard-placeholder"><h2>No Venue Found</h2><p>Please register your venue profile.</p></div>;

  return (
    <div className="my-venue-redesign">
      
      {/* Redesigned Cover Banner */}
      <div className="vd-cover-frame" style={{ height: "260px", marginBottom: "32px", aspectRatio: "auto" }}>
        <img 
          src={venue.images?.[0] || "https://images.unsplash.com/photo-1566417713940-fe7c8460ffd3?w=1000"} 
          alt={venue.name} 
        />
        {venue.is_verified && (
          <span className="vd-location-badge" style={{ background: "rgba(16, 185, 129, 0.9)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
            ✓ Verified Partner
          </span>
        )}
        
        <div style={{ position: "absolute", top: "16px", right: "16px", zIndex: 10 }}>
          {!editing ? (
            <button className="vd-btn-primary" onClick={() => setEditing(true)} style={{ background: "rgba(0, 0, 0, 0.65)", borderColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <HiPencil /> Edit Profile
            </button>
          ) : (
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="vd-btn-primary" onClick={handleSave} style={{ background: "#10b981", borderColor: "#10b981" }}>
                <HiCheck /> Save
              </button>
              <button className="vd-btn-outline" onClick={() => { setEditing(false); setForm(venue); }} style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                <HiXMark /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid Fields & Settings Panels */}
      <div className="home-split-row">
        
        {/* Left Column: Basic Info & Profile Fields */}
        <div className="home-col-left" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div className="glass-card">
            <h3 className="glass-card__title">
              <HiBuildingStorefront style={{ color: "var(--primary)" }} /> Basic Information
            </h3>
            
            <div className="my-venue-fields-list">
              <div className="create-event__field">
                <label className="vd-form-lbl">Venue Name</label>
                {editing ? (
                  <input 
                    type="text" 
                    value={form.name || ""} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{ background: "#1a1a24", border: "1px solid var(--border)", color: "white", padding: "10px 14px", borderRadius: "8px" }}
                  />
                ) : (
                  <p className="my-venue-val">{venue.name}</p>
                )}
              </div>

              <div className="create-event__field" style={{ marginTop: "16px" }}>
                <label className="vd-form-lbl">Category</label>
                {editing ? (
                  <select 
                    value={form.category || "club"} 
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{ width: "100%", background: "#1a1a24", border: "1px solid var(--border)", color: "white", padding: "10px 14px", borderRadius: "8px" }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                ) : (
                  <p className="my-venue-val" style={{ textTransform: "capitalize" }}>{getCategoryLabel(venue.category)}</p>
                )}
              </div>

              <div className="create-event__field" style={{ marginTop: "16px" }}>
                <label className="vd-form-lbl">Description</label>
                {editing ? (
                  <textarea 
                    value={form.description || ""} 
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    style={{ background: "#1a1a24", border: "1px solid var(--border)", color: "white", padding: "10px 14px", borderRadius: "8px", width: "100%", resize: "none" }}
                  />
                ) : (
                  <p className="my-venue-val" style={{ fontSize: "0.88rem", lineHeight: 1.6, color: "rgba(255,255,255,0.75)" }}>
                    {venue.description || "No description provided."}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 🖼️ Venue Cover & Gallery Photos Card */}
          <div className="glass-card">
            <h3 className="glass-card__title">
              🖼️ Venue Cover & Gallery Photos
            </h3>

            <div className="my-venue-fields-list">
              <div className="create-event__field">
                <label className="vd-form-lbl">Main Cover Photo URL</label>
                {editing ? (
                  <input 
                    type="url" 
                    placeholder="https://images.unsplash.com/..." 
                    value={mainCoverUrl} 
                    onChange={(e) => setMainCoverUrl(e.target.value)}
                    style={{ background: "#1a1a24", border: "1px solid var(--border)", color: "white", padding: "10px 14px", borderRadius: "8px", width: "100%" }}
                  />
                ) : (
                  <p className="my-venue-val" style={{ wordBreak: "break-all", fontSize: "0.8rem" }}>{venue.images?.[0] || "Default banner"}</p>
                )}
              </div>

              <div className="create-event__field" style={{ marginTop: "16px" }}>
                <label className="vd-form-lbl">Gallery Photo URLs (Comma-Separated)</label>
                {editing ? (
                  <div>
                    <textarea 
                      placeholder="https://images.../photo1.jpg, https://images.../photo2.jpg" 
                      value={galleryUrlsStr} 
                      onChange={(e) => setGalleryUrlsStr(e.target.value)}
                      rows={3}
                      style={{ background: "#1a1a24", border: "1px solid var(--border)", color: "white", padding: "10px 14px", borderRadius: "8px", width: "100%", resize: "none" }}
                    />
                    <span style={{ fontSize: "0.72rem", color: "hsl(var(--muted))", marginTop: "4px", display: "block" }}>
                      💡 Enter photo URLs separated by commas for your VIP lounge, dance floor, bar, etc.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                    {venue.images && venue.images.length > 1 ? (
                      venue.images.slice(1).map((img, i) => (
                        <img key={i} src={img} alt={`Gallery ${i+1}`} style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} />
                      ))
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "hsl(var(--muted))" }}>No extra gallery photos added. Click Edit to add photo URLs.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h3 className="glass-card__title">
              <HiMapPin style={{ color: "#ef4444" }} /> Location & Address
            </h3>

            <div className="my-venue-fields-list">
              <div className="create-event__field">
                <label className="vd-form-lbl">Full Address</label>
                {editing ? (
                  <input 
                    type="text" 
                    value={form.address || ""} 
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    style={{ background: "#1a1a24", border: "1px solid var(--border)", color: "white", padding: "10px 14px", borderRadius: "8px" }}
                  />
                ) : (
                  <p className="my-venue-val">{venue.address}</p>
                )}
              </div>

              <div className="ed-card-row" style={{ marginTop: "16px" }}>
                <div className="create-event__field">
                  <label className="vd-form-lbl">City</label>
                  {editing ? (
                    <input 
                      type="text" 
                      value={form.city || ""} 
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      style={{ background: "#1a1a24", border: "1px solid var(--border)", color: "white", padding: "10px 14px", borderRadius: "8px" }}
                    />
                  ) : (
                    <p className="my-venue-val">{venue.city}</p>
                  )}
                </div>
                <div className="create-event__field">
                  <label className="vd-form-lbl">State</label>
                  {editing ? (
                    <input 
                      type="text" 
                      value={form.state || ""} 
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      style={{ background: "#1a1a24", border: "1px solid var(--border)", color: "white", padding: "10px 14px", borderRadius: "8px" }}
                    />
                  ) : (
                    <p className="my-venue-val">{venue.state || "—"}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Contact Details & Amenities */}
        <div className="home-col-right" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div className="glass-card">
            <h3 className="glass-card__title">
              <HiPhone style={{ color: "#10b981" }} /> Contact Details
            </h3>

            <div className="my-venue-fields-list">
              <div className="create-event__field">
                <label className="vd-form-lbl">Contact Number</label>
                {editing ? (
                  <input 
                    type="text" 
                    value={form.phone || ""} 
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    style={{ background: "#1a1a24", border: "1px solid var(--border)", color: "white", padding: "10px 14px", borderRadius: "8px" }}
                  />
                ) : (
                  <p className="my-venue-val">{venue.phone || "—"}</p>
                )}
              </div>

              <div className="create-event__field" style={{ marginTop: "16px" }}>
                <label className="vd-form-lbl">Email Address</label>
                {editing ? (
                  <input 
                    type="email" 
                    value={form.email || ""} 
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    style={{ background: "#1a1a24", border: "1px solid var(--border)", color: "white", padding: "10px 14px", borderRadius: "8px" }}
                  />
                ) : (
                  <p className="my-venue-val">{venue.email || "—"}</p>
                )}
              </div>

              <div className="create-event__field" style={{ marginTop: "16px" }}>
                <label className="vd-form-lbl">Official Website</label>
                {editing ? (
                  <input 
                    type="text" 
                    value={form.website || ""} 
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    style={{ background: "#1a1a24", border: "1px solid var(--border)", color: "white", padding: "10px 14px", borderRadius: "8px" }}
                  />
                ) : (
                  <p className="my-venue-val">
                    {venue.website ? (
                      <a href={venue.website} target="_blank" rel="noreferrer" style={{ color: "var(--primary-light)" }}>
                        {venue.website.replace("https://", "").replace("http://", "")}
                      </a>
                    ) : (
                      "—"
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h3 className="glass-card__title">
              <HiSparkles style={{ color: "#f59e0b" }} /> Featured Amenities
            </h3>

            {venue.amenities && venue.amenities.length > 0 ? (
              <div className="vd-amenities-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                {venue.amenities.map((a) => (
                  <span key={a} className="vd-amenity-badge">
                    <span className="vd-amenity-icon">{AMENITY_ICONS[a] || "✨"}</span> {a}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: "hsl(var(--muted))", fontSize: "0.85rem", margin: 0 }}>No amenities configured.</p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

export default MyVenue;
