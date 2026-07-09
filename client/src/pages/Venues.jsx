import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  HiMagnifyingGlass, 
  HiMapPin, 
  HiShieldCheck, 
  HiClock,
  HiChevronDown
} from "react-icons/hi2";
import api from "../lib/api";
import toast from "react-hot-toast";
import "./Venues.css";

const CATEGORIES = [
  { value: "all", label: "All Spots" },
  { value: "club", label: "Clubs" },
  { value: "bar", label: "Bars" },
  { value: "cafe", label: "Cafes" },
  { value: "restaurant", label: "Restaurants" },
  { value: "concert_hall", label: "Concert Halls" },
  { value: "outdoor", label: "Outdoor" },
];

const CITIES = ["All Cities", "Mumbai", "Delhi", "Bengaluru", "Pune", "Goa"];

function Venues() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCity, setSelectedCity] = useState("All Cities");

  useEffect(() => {
    fetchVenues();
  }, [selectedCategory, selectedCity]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = {};
      if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }
      if (selectedCity !== "All Cities") {
        params.city = selectedCity;
      }

      const res = await api.get("/venues", { params });
      if (res.data?.success) {
        setVenues(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching venues:", err);
      toast.error("Failed to load venues");
    } finally {
      setLoading(false);
    }
  };

  // Perform client-side filter based on text query
  const filteredVenues = venues.filter((venue) => {
    const query = searchQuery.toLowerCase();
    return (
      venue.name.toLowerCase().includes(query) ||
      venue.address.toLowerCase().includes(query) ||
      venue.city.toLowerCase().includes(query)
    );
  });

  return (
    <div className="venues-page">
      <div className="venues-container">
        <header className="venues-header">
          <h1>Discover <em>Nightlife Spots</em></h1>
          <p>Find the best clubs, bars, lounges, and secret nightlife setups verified by AfterDark.</p>
        </header>

        {/* Filters and Search Bar */}
        <div className="venues-filters-bar">
          {/* Search box */}
          <div className="venues-search">
            <HiMagnifyingGlass className="venues-search__icon" />
            <input
              type="text"
              placeholder="Search by venue name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* City selector */}
          <div className="venues-location-select">
            <HiMapPin style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted))" }} />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{ paddingLeft: "38px" }}
            >
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <HiChevronDown className="venues-location-select__icon" />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="venues-tabs" style={{ marginBottom: "32px" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`venues-tab-btn ${selectedCategory === cat.value ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Loading and Grid view */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div className="auth-spinner" style={{ margin: "0 auto 16px auto" }} />
            <p style={{ color: "hsl(var(--muted))" }}>Discovering venues...</p>
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="venues-empty">
            <h3>No Spots Found</h3>
            <p>We couldn't find any verified venues matching your filters. Try checking other locations or keywords!</p>
          </div>
        ) : (
          <div className="venues-grid">
            {filteredVenues.map((venue) => (
              <article key={venue.id} className="venue-dir-card">
                <div className="venue-dir-card__image-container">
                  <img
                    src={venue.images?.[0] || "https://images.unsplash.com/photo-1566417713940-fe7c8460ffd3?w=800"}
                    alt={venue.name}
                    className="venue-dir-card__image"
                    loading="lazy"
                  />
                  <span className="venue-dir-card__badge">{venue.category}</span>
                </div>

                <div className="venue-dir-card__content">
                  <div className="venue-dir-card__header">
                    <h3 className="venue-dir-card__title">{venue.name}</h3>
                    {venue.is_verified && (
                      <span className="venue-dir-card__verified">
                        <HiShieldCheck /> Verified
                      </span>
                    )}
                  </div>

                  <p className="venue-dir-card__address">
                    <HiMapPin style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
                    {venue.address}, {venue.city}
                  </p>

                  <p className="venue-dir-card__description">{venue.description || "A premium nightlife venue featuring amazing music and craft drinks."}</p>

                  <div className="venue-dir-card__meta">
                    <span className="venue-dir-card__time">
                      <HiClock style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
                      {venue.opening_time?.slice(0, 5) || "20:00"} - {venue.closing_time?.slice(0, 5) || "03:00"}
                    </span>
                    
                    <Link to={`/venues/${venue.id}`}>
                      <button className="venue-dir-card__btn">Explore</button>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Venues;
