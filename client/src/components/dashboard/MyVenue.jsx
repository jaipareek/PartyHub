import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { HiPencil, HiCheck, HiXMark } from "react-icons/hi2";

function MyVenue() {
  const { user } = useAuth();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const res = await api.get("/owner/profile");
        if (res.data.data.venue) {
          setVenue(res.data.data.venue);
          setForm(res.data.data.venue);
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
      });
      setVenue(res.data.data);
      setEditing(false);
      toast.success("Venue updated!");
    } catch (err) {
      toast.error("Failed to update venue");
    }
  };

  if (loading) return <div className="dashboard-placeholder"><p>Loading venue...</p></div>;
  if (!venue) return <div className="dashboard-placeholder"><p>No venue found.</p></div>;

  return (
    <div className="my-venue">
      <div className="my-venue__header">
        <h2>My Venue</h2>
        {!editing ? (
          <button className="my-venue__edit-btn" onClick={() => setEditing(true)}>
            <HiPencil /> Edit
          </button>
        ) : (
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="my-venue__save-btn" onClick={handleSave}>
              <HiCheck /> Save
            </button>
            <button className="my-venue__cancel-btn" onClick={() => { setEditing(false); setForm(venue); }}>
              <HiXMark /> Cancel
            </button>
          </div>
        )}
      </div>

      {/* Cover image */}
      {venue.images?.[0] && (
        <div className="my-venue__cover">
          <img src={venue.images[0]} alt={venue.name} />
          {venue.is_verified && <span className="my-venue__badge">✓ Verified</span>}
        </div>
      )}

      {/* Details grid */}
      <div className="my-venue__grid">
        <Field label="Venue Name" value={form.name} field="name" editing={editing} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="Category" value={form.category} field="category" editing={editing} onChange={(v) => setForm({ ...form, category: v })} />
        <Field label="Description" value={form.description} field="description" editing={editing} onChange={(v) => setForm({ ...form, description: v })} wide />
        <Field label="Address" value={form.address} field="address" editing={editing} onChange={(v) => setForm({ ...form, address: v })} wide />
        <Field label="City" value={form.city} field="city" editing={editing} onChange={(v) => setForm({ ...form, city: v })} />
        <Field label="State" value={form.state} field="state" editing={editing} onChange={(v) => setForm({ ...form, state: v })} />
        <Field label="Phone" value={form.phone} field="phone" editing={editing} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Email" value={form.email} field="email" editing={editing} onChange={(v) => setForm({ ...form, email: v })} />
        <Field label="Website" value={form.website} field="website" editing={editing} onChange={(v) => setForm({ ...form, website: v })} wide />
      </div>

      {/* Amenities */}
      {venue.amenities?.length > 0 && (
        <div className="my-venue__amenities">
          <h3>Amenities</h3>
          <div className="my-venue__amenity-tags">
            {venue.amenities.map((a) => (
              <span key={a} className="my-venue__amenity-tag">{a}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, editing, onChange, wide }) {
  return (
    <div className={`my-venue__field ${wide ? "col-span-2" : ""}`}>
      <label>{label}</label>
      {editing ? (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <p>{value || "—"}</p>
      )}
    </div>
  );
}

export default MyVenue;
