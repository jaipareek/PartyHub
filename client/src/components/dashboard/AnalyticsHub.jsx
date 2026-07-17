import { useState, useEffect } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { 
  HiCurrencyRupee, 
  HiTicket, 
  HiArrowTrendingUp, 
  HiTableCells,
  HiClock,
  HiUserGroup
} from "react-icons/hi2";

function AnalyticsHub({ venueId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hover states for tooltips
  const [hoveredSalesIndex, setHoveredSalesIndex] = useState(null);
  const [hoveredArrivalIndex, setHoveredArrivalIndex] = useState(null);

  useEffect(() => {
    if (venueId) {
      fetchAnalytics();
    }
  }, [venueId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/owner/analytics/${venueId}`);
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
      toast.error("Could not load analytics metrics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-placeholder">
        <div className="venue-detail__loading-spinner" style={{ margin: "50px auto" }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-placeholder">
        <h2>No Analytics Data</h2>
        <p>Operational reports will display once tickets or tables are booked.</p>
      </div>
    );
  }

  const { kpis, salesHistory = [], checkinArrivals = [], guestSegments = [] } = data;

  // ============================================
  // 📈 SVG PLOTTING CALCULATIONS
  // ============================================

  // 1. Sales Area Chart calculations
  const maxRevenue = Math.max(...salesHistory.map(s => s.revenue), 1000);
  const chartHeight = 180;
  const chartWidth = 500;
  const padding = 30;

  // Generate SVG Points for Line & Area
  const points = salesHistory.map((s, idx) => {
    const x = padding + (idx * (chartWidth - padding * 2)) / (salesHistory.length - 1);
    const y = chartHeight - padding - (s.revenue * (chartHeight - padding * 2)) / maxRevenue;
    return { x, y, revenue: s.revenue, passes: s.passes, date: s.date };
  });

  const pathD = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")
    : "";

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`
    : "";

  // 2. Gate Entry Arrivals Bar Chart calculations
  const maxArrivals = Math.max(...checkinArrivals.map(c => c.count), 5);
  const barChartHeight = 180;
  const barChartWidth = 500;
  const barWidth = 30;

  // 3. Guest Segments Donut Chart calculations
  const totalSegmentsValue = guestSegments.reduce((sum, g) => sum + g.value, 0) || 1;
  const regularPct = Math.round((guestSegments[0]?.value / totalSegmentsValue) * 100) || 0;
  const studentPct = Math.round((guestSegments[1]?.value / totalSegmentsValue) * 100) || 0;

  // Donut Circle Math
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const regularOffset = circumference - (regularPct / 100) * circumference;

  return (
    <div className="analytics-hub" style={{ textAlign: "left" }}>
      
      {/* 📊 KPI CARDS GRID */}
      <div className="vd-scorecards-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
        
        {/* KPI 1: Gross Revenue */}
        <div className="vd-metric-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span className="vd-metric-lbl">Gross Revenue</span>
            <HiCurrencyRupee style={{ color: "#7d5cfc", fontSize: "1.3rem" }} />
          </div>
          <span className="vd-metric-val" style={{ fontSize: "1.75rem", color: "white", textShadow: "0 0 10px rgba(125,92,252,0.25)" }}>
            ₹{kpis.totalRevenue.toLocaleString()}
          </span>
          <span style={{ fontSize: "0.72rem", color: "hsl(var(--muted))", display: "block", marginTop: "4px" }}>
            Aggregate ticket sales
          </span>
        </div>

        {/* KPI 2: Passes Booked */}
        <div className="vd-metric-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span className="vd-metric-lbl">Passes Sold</span>
            <HiTicket style={{ color: "#10b981", fontSize: "1.3rem" }} />
          </div>
          <span className="vd-metric-val" style={{ fontSize: "1.75rem", color: "white" }}>
            {kpis.totalPasses}
          </span>
          <span style={{ fontSize: "0.72rem", color: "hsl(var(--muted))", display: "block", marginTop: "4px" }}>
            Total checked-in + confirmed headcount
          </span>
        </div>

        {/* KPI 3: Check-in Attendance */}
        <div className="vd-metric-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span className="vd-metric-lbl">Gate Check-In Rate</span>
            <HiArrowTrendingUp style={{ color: "#ef4444", fontSize: "1.3rem" }} />
          </div>
          <span className="vd-metric-val" style={{ fontSize: "1.75rem", color: "white" }}>
            {kpis.checkInRate}%
          </span>
          <span style={{ fontSize: "0.72rem", color: "hsl(var(--muted))", display: "block", marginTop: "4px" }}>
            Arrived guests vs. bookings
          </span>
        </div>

        {/* KPI 4: Table Bookings */}
        <div className="vd-metric-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span className="vd-metric-lbl">Table Requests</span>
            <HiTableCells style={{ color: "#f59e0b", fontSize: "1.3rem" }} />
          </div>
          <span className="vd-metric-val" style={{ fontSize: "1.75rem", color: "white" }}>
            {kpis.totalTables}
          </span>
          <span style={{ fontSize: "0.72rem", color: kpis.pendingTables > 0 ? "#f59e0b" : "hsl(var(--muted))", display: "block", marginTop: "4px" }}>
            {kpis.pendingTables > 0 ? `⚠️ ${kpis.pendingTables} pending verification` : "All reservations resolved"}
          </span>
        </div>

      </div>

      {/* 📈 VISUAL CHARTS SECTION */}
      <div className="home-split-row" style={{ gap: "24px" }}>
        
        {/* Left Column Chart: Sales Velocity Timeline */}
        <div className="home-col-left" style={{ flex: 1.3 }}>
          <div className="glass-card" style={{ position: "relative" }}>
            <h3 className="glass-card__title" style={{ marginBottom: "20px" }}>
              📈 Ticket Sales Velocity
            </h3>

            {/* Custom Responsive SVG Chart */}
            <div style={{ position: "relative", width: "100%", height: `${chartHeight}px` }}>
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                style={{ width: "100%", height: "100%", overflow: "visible" }}
              >
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7d5cfc" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="#7d5cfc" stopOpacity="0"/>
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="rgba(255,255,255,0.05)" />
                <line x1={padding} y1={(chartHeight) / 2} x2={chartWidth - padding} y2={(chartHeight) / 2} stroke="rgba(255,255,255,0.05)" />
                <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(255,255,255,0.15)" />

                {/* Area under the line */}
                {areaD && <path d={areaD} fill="url(#salesGrad)" />}

                {/* Line Plot */}
                {pathD && (
                  <path 
                    d={pathD} 
                    fill="none" 
                    stroke="#7d5cfc" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                    style={{ filter: "drop-shadow(0px 0px 8px rgba(125,92,252,0.4))" }}
                  />
                )}

                {/* Data Points */}
                {points.map((p, idx) => (
                  <g key={idx}>
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r={hoveredSalesIndex === idx ? "7" : "4.5"} 
                      fill={hoveredSalesIndex === idx ? "#a78bfa" : "#7d5cfc"} 
                      stroke="white"
                      strokeWidth="2.5"
                      style={{ cursor: "pointer", transition: "all 0.15s ease" }}
                      onMouseEnter={() => setHoveredSalesIndex(idx)}
                      onMouseLeave={() => setHoveredSalesIndex(null)}
                    />
                  </g>
                ))}
              </svg>

              {/* Hover Tooltip Overlay */}
              {hoveredSalesIndex !== null && points[hoveredSalesIndex] && (
                <div style={{
                  position: "absolute",
                  left: `${(points[hoveredSalesIndex].x / chartWidth) * 100}%`,
                  top: `${(points[hoveredSalesIndex].y / chartHeight) * 100 - 30}%`,
                  transform: "translate(-50%, -100%)",
                  background: "#1a1a24",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  color: "white",
                  fontSize: "0.78rem",
                  boxShadow: "0 10px 20px rgba(0,0,0,0.5)",
                  pointerEvents: "none",
                  zIndex: 50,
                  whiteSpace: "nowrap"
                }}>
                  <strong style={{ display: "block", color: "#a78bfa" }}>{points[hoveredSalesIndex].date}</strong>
                  <span>Revenue: <strong>₹{points[hoveredSalesIndex].revenue.toLocaleString()}</strong></span>
                  <span style={{ display: "block", fontSize: "0.7rem", color: "hsl(var(--muted))" }}>Tickets: {points[hoveredSalesIndex].passes}</span>
                </div>
              )}
            </div>

            {/* X-Axis labels */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0 10px", marginTop: "12px", fontSize: "0.72rem", color: "hsl(var(--muted))" }}>
              <span>{salesHistory[0]?.date}</span>
              <span>{salesHistory[Math.floor(salesHistory.length / 2)]?.date}</span>
              <span>{salesHistory[salesHistory.length - 1]?.date}</span>
            </div>
          </div>
        </div>

        {/* Right Column Chart: Peak Check-in Hours */}
        <div className="home-col-right" style={{ flex: 1 }}>
          <div className="glass-card" style={{ position: "relative" }}>
            <h3 className="glass-card__title" style={{ marginBottom: "20px" }}>
              <HiClock style={{ color: "#ef4444" }} /> Peak Arrival Hours
            </h3>

            {/* SVG Bar Chart */}
            <div style={{ position: "relative", width: "100%", height: `${barChartHeight}px` }}>
              <svg 
                viewBox={`0 0 ${barChartWidth} ${barChartHeight}`} 
                style={{ width: "100%", height: "100%", overflow: "visible" }}
              >
                {/* Horizontal baseline */}
                <line x1={0} y1={barChartHeight - padding} x2={barChartWidth} y2={barChartHeight - padding} stroke="rgba(255,255,255,0.15)" />

                {checkinArrivals.map((c, idx) => {
                  const x = (idx * barChartWidth) / checkinArrivals.length + (barChartWidth / checkinArrivals.length - barWidth) / 2;
                  const barValHeight = (c.count * (barChartHeight - padding * 2)) / maxArrivals;
                  const y = barChartHeight - padding - barValHeight;

                  return (
                    <g key={idx}>
                      {/* Interactive Bar Column */}
                      <rect 
                        x={x}
                        y={y}
                        width={barWidth}
                        height={Math.max(barValHeight, 4)} // at least 4px height so empty bars show a line
                        rx="6"
                        fill={hoveredArrivalIndex === idx ? "#ff6b6b" : "rgba(239, 68, 68, 0.85)"}
                        style={{ cursor: "pointer", transition: "fill 0.15s ease" }}
                        onMouseEnter={() => setHoveredArrivalIndex(idx)}
                        onMouseLeave={() => setHoveredArrivalIndex(null)}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Hover Tooltip Overlay */}
              {hoveredArrivalIndex !== null && checkinArrivals[hoveredArrivalIndex] && (
                <div style={{
                  position: "absolute",
                  left: `${((hoveredArrivalIndex * barChartWidth / checkinArrivals.length + (barChartWidth / checkinArrivals.length - barWidth) / 2 + barWidth / 2) / barChartWidth) * 100}%`,
                  top: "20%",
                  transform: "translate(-50%, -100%)",
                  background: "#1a1a24",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  color: "white",
                  fontSize: "0.78rem",
                  boxShadow: "0 10px 20px rgba(0,0,0,0.5)",
                  pointerEvents: "none",
                  zIndex: 50,
                  whiteSpace: "nowrap"
                }}>
                  <strong style={{ display: "block", color: "#ff6b6b" }}>{checkinArrivals[hoveredArrivalIndex].hour}</strong>
                  <span>Check-ins: <strong>{checkinArrivals[hoveredArrivalIndex].count} Guests</strong></span>
                </div>
              )}
            </div>

            {/* X-Axis labels */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "0.68rem", color: "hsl(var(--muted))" }}>
              {checkinArrivals.map((c, idx) => (
                <span key={idx} style={{ width: `${100 / checkinArrivals.length}%`, textAlign: "center" }}>
                  {c.hour.replace(" ", "")}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Donut Chart Row: Regular vs Student Deals */}
      <div className="glass-card" style={{ marginTop: "24px" }}>
        <h3 className="glass-card__title" style={{ marginBottom: "20px" }}>
          <HiUserGroup style={{ color: "#10b981" }} /> Guest Profile Segments
        </h3>

        <div style={{ display: "flex", alignItems: "center", gap: "40px", flexWrap: "wrap" }}>
          {/* SVG Donut Circle */}
          <div style={{ position: "relative", width: "130px", height: "130px" }}>
            <svg width="100%" height="100%" viewBox="0 0 130 130">
              {/* Background Circle */}
              <circle 
                cx="65" 
                cy="65" 
                r={radius} 
                fill="transparent" 
                stroke="rgba(255,255,255,0.03)" 
                strokeWidth="12" 
              />
              {/* Regular Tickets Slice */}
              <circle 
                cx="65" 
                cy="65" 
                r={radius} 
                fill="transparent" 
                stroke="#10b981" 
                strokeWidth="12" 
                strokeDasharray={circumference}
                strokeDashoffset={regularOffset}
                strokeLinecap="round"
                transform="rotate(-90 65 65)"
                style={{ filter: "drop-shadow(0 0 4px rgba(16,185,129,0.3))" }}
              />
            </svg>
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center"
            }}>
              <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "white", display: "block" }}>
                {regularPct}%
              </span>
              <span style={{ fontSize: "0.62rem", color: "hsl(var(--muted))", textTransform: "uppercase", fontWeight: 700 }}>
                Regular
              </span>
            </div>
          </div>

          {/* Legend Table */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981" }} />
                <span style={{ fontSize: "0.85rem", color: "white" }}>Regular Admissions</span>
              </div>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "white" }}>
                {guestSegments[0]?.value || 0} Tickets ({regularPct}%)
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#a78bfa" }} />
                <span style={{ fontSize: "0.85rem", color: "white" }}>Student Discount Passes</span>
              </div>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "white" }}>
                {guestSegments[1]?.value || 0} Tickets ({studentPct}%)
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default AnalyticsHub;
