import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  HiMagnifyingGlass,
  HiXMark,
  HiSparkles,
} from "react-icons/hi2";
import api from "../lib/api";
import EventCard from "../components/ui/EventCard";
import "./Events.css";

// 🧠 LEARN: Category filter configuration
// Each chip has a value (sent to API) and a label (shown to user)
const CATEGORIES = [
  { value: "", label: "All" },
  { value: "club_night", label: "Club Night" },
  { value: "live_music", label: "Live Music" },
  { value: "standup", label: "Comedy" },
  { value: "open_mic", label: "Open Mic" },
  { value: "gaming", label: "Gaming" },
  { value: "festival", label: "Festival" },
];

const SORT_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "popularity", label: "Popularity" },
];

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [sortBy, setSortBy] = useState("date");

  // 🧠 LEARN: useRef for debounce timer
  // We store the timeout ID so we can cancel it if the user types again
  // before the 300ms delay finishes. This prevents flooding the API.
  const debounceRef = useRef(null);

  // ── Fetch events from API ──
  const fetchEvents = useCallback(async (query, category, sort) => {
    try {
      setLoading(true);
      const params = {};
      if (query) params.q = query;
      if (category) params.category = category;
      // Send sort to API only for date and popularity (server-side)
      if (sort === "popularity") params.sort = "popularity";
      else params.sort = "date";

      const res = await api.get("/events/search", { params });
      let data = res.data.data || [];

      // 🧠 LEARN: Client-side sorting for price
      // Supabase can't easily sort by a JSONB nested field,
      // so we sort price client-side after fetching
      if (sort === "price_asc") {
        data.sort((a, b) => {
          const priceA = a.pricing
            ? Math.min(...a.pricing.map((p) => p.price))
            : 0;
          const priceB = b.pricing
            ? Math.min(...b.pricing.map((p) => p.price))
            : 0;
          return priceA - priceB;
        });
      } else if (sort === "price_desc") {
        data.sort((a, b) => {
          const priceA = a.pricing
            ? Math.min(...a.pricing.map((p) => p.price))
            : 0;
          const priceB = b.pricing
            ? Math.min(...b.pricing.map((p) => p.price))
            : 0;
          return priceB - priceA;
        });
      }

      setEvents(data);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial load ──
  useEffect(() => {
    fetchEvents("", "", "date");
    window.scrollTo(0, 0);
  }, [fetchEvents]);

  // ── Debounced search handler ──
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous timer
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Set new timer — waits 300ms after user stops typing
    debounceRef.current = setTimeout(() => {
      fetchEvents(value, activeCategory, sortBy);
    }, 300);
  };

  // ── Category filter handler ──
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    fetchEvents(searchQuery, category, sortBy);
  };

  // ── Sort handler ──
  const handleSortChange = (e) => {
    const sort = e.target.value;
    setSortBy(sort);
    fetchEvents(searchQuery, activeCategory, sort);
  };

  // ── Clear all filters ──
  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategory("");
    setSortBy("date");
    fetchEvents("", "", "date");
  };

  // ── Clear search ──
  const clearSearch = () => {
    setSearchQuery("");
    fetchEvents("", activeCategory, sortBy);
  };

  return (
    <div className="events-page">
      {/* ═══════════════════════════
         SEARCH HEADER
       ═══════════════════════════ */}
      <motion.section
        className="events-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="events-header__title">
          Discover <em>events</em>
        </h1>
        <p className="events-header__subtitle">
          Find the perfect night out — search, filter, and explore
        </p>

        {/* Search Input */}
        <div className="events-search">
          <HiMagnifyingGlass className="events-search__icon" />
          <input
            type="text"
            className="events-search__input"
            placeholder="Search events, venues, artists..."
            value={searchQuery}
            onChange={handleSearchChange}
            id="events-search-input"
          />
          {searchQuery && (
            <button
              className="events-search__clear"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <HiXMark />
            </button>
          )}
        </div>
      </motion.section>

      {/* ═══════════════════════════
         FILTER BAR
       ═══════════════════════════ */}
      <motion.div
        className="events-filters"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        {/* Category Chips */}
        <div className="events-filters__chips">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`events-filters__chip ${
                activeCategory === cat.value
                  ? "events-filters__chip--active"
                  : ""
              }`}
              onClick={() => handleCategoryChange(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="events-filters__sort">
          <span className="events-filters__sort-label">Sort</span>
          <select
            className="events-filters__sort-select"
            value={sortBy}
            onChange={handleSortChange}
            id="events-sort-select"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Results count */}
      {!loading && (
        <div className="events-results-info">
          Showing <span>{events.length}</span> event
          {events.length !== 1 ? "s" : ""}
          {searchQuery && (
            <>
              {" "}
              for "<span>{searchQuery}</span>"
            </>
          )}
          {activeCategory && (
            <>
              {" "}
              in{" "}
              <span>
                {CATEGORIES.find((c) => c.value === activeCategory)?.label}
              </span>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════
         EVENTS GRID / LOADING / EMPTY
       ═══════════════════════════ */}
      {loading ? (
        <div className="events-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton events-skeleton-card" />
          ))}
        </div>
      ) : events.length > 0 ? (
        <motion.div
          className="events-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <EventCard event={event} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        /* ── Empty State ── */
        <div className="events-empty">
          <div className="events-empty__icon">
            <HiSparkles />
          </div>
          <h2 className="events-empty__title">No events found</h2>
          <p className="events-empty__text">
            Try adjusting your search or filters to discover more events
          </p>
          <button className="events-empty__btn" onClick={clearFilters}>
            <HiXMark /> Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

export default Events;
