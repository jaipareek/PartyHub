import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { HiPlus } from "react-icons/hi2";

const EVENT_TYPES = [
  { value: "club_night", label: "Club Night" },
  { value: "live_music", label: "Live Music" },
  { value: "karaoke", label: "Karaoke" },
  { value: "comedy", label: "Comedy Show" },
  { value: "brunch_party", label: "Brunch Party" },
  { value: "themed_night", label: "Themed Night" },
  { value: "ladies_night", label: "Ladies' Night" },
  { value: "other", label: "Other" },
];

function CreateEvent() {
  const { user } = useAuth();
  const [venueId, setVenueId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("club_night");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("21:00");
  const [endTime, setEndTime] = useState("02:00");
  const [posterUrl, setPosterUrl] = useState("");
  const [totalCapacity, setTotalCapacity] = useState(200);
  const [isStudentDeal, setIsStudentDeal] = useState(false);
  const [studentDiscount, setStudentDiscount] = useState(20);

  // Fetch venue ID on mount
  useEffect(() => {
    const getVenue = async () => {
      const { data } = await supabase
        .from("venues")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      if (data) setVenueId(data.id);
    };
    getVenue();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !date || !startTime || !totalCapacity) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      await api.post("/events", {
        venue_id: venueId,
        title,
        description,
        event_type: eventType,
        poster_url: posterUrl,
        date,
        start_time: `${startTime}:00`,
        end_time: endTime ? `${endTime}:00` : null,
        total_capacity: parseInt(totalCapacity),
        is_student_deal: isStudentDeal,
        student_discount_percent: isStudentDeal ? parseInt(studentDiscount) : 0,
        pricing: [],
        tags: [],
      });

      toast.success("Event created! 🎉");
      // Reset form
      setTitle(""); setDescription(""); setDate("");
      setPosterUrl(""); setTotalCapacity(200);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-event">
      <h2>Create New Event</h2>
      <p className="create-event__subtitle">Fill in the details to publish a new event at your venue.</p>

      <form onSubmit={handleSubmit} className="create-event__form">
        <div className="create-event__grid">
          <div className="create-event__field">
            <label>Event Title *</label>
            <input type="text" placeholder="e.g., Neon Night Saturday" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="create-event__field">
            <label>Event Type *</label>
            <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
              {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="create-event__field col-span-2">
            <label>Description</label>
            <textarea rows={3} placeholder="What makes this event special?" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="create-event__field">
            <label>Date *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>

          <div className="create-event__field">
            <label>Capacity *</label>
            <input type="number" min="1" value={totalCapacity} onChange={(e) => setTotalCapacity(e.target.value)} required />
          </div>

          <div className="create-event__field">
            <label>Start Time *</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </div>

          <div className="create-event__field">
            <label>End Time</label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>

          <div className="create-event__field col-span-2">
            <label>Poster Image URL</label>
            <input type="url" placeholder="https://images.unsplash.com/..." value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} />
          </div>

          <div className="create-event__field col-span-2">
            <label className="create-event__checkbox-label">
              <input type="checkbox" checked={isStudentDeal} onChange={(e) => setIsStudentDeal(e.target.checked)} />
              <span>Student Deal — Offer a discount for students</span>
            </label>
            {isStudentDeal && (
              <div style={{ marginTop: "10px" }}>
                <label style={{ fontSize: "0.75rem", color: "hsl(var(--muted))" }}>Discount: {studentDiscount}%</label>
                <input
                  type="range"
                  min="5" max="50" step="5"
                  value={studentDiscount}
                  onChange={(e) => setStudentDiscount(e.target.value)}
                  style={{ width: "100%", marginTop: "6px" }}
                />
              </div>
            )}
          </div>
        </div>

        <button type="submit" className="create-event__submit" disabled={loading}>
          {loading ? "Publishing..." : <><HiPlus /> Publish Event</>}
        </button>
      </form>
    </div>
  );
}

export default CreateEvent;
