// ============================================
// 👑 Admin Controller — Platform Administration
// ============================================
import supabase from "../config/supabase.js";

// GET /api/admin/venues — List all venues for admin
export const getVenues = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("venues")
      .select(`
        *,
        owner:profiles!venues_owner_id_fkey (id, full_name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Admin error fetching venues:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/admin/venues/:id/verify — Toggle verification status
export const verifyVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_verified } = req.body;

    if (is_verified === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: is_verified",
      });
    }

    const { data, error } = await supabase
      .from("venues")
      .update({ is_verified })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: `Venue verification status updated to ${is_verified}`,
      data,
    });
  } catch (error) {
    console.error("Admin error verifying venue:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/admin/students — List all students pending verification
export const getPendingStudents = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .in("student_verification_status", ["pending", "approved", "rejected"])
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Admin error fetching students:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/admin/students/:profileId/verify — Verify student status (approve or reject)
export const verifyStudent = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid verification status. Must be 'approved' or 'rejected'.",
      });
    }

    const isStudent = status === "approved";

    const { data, error } = await supabase
      .from("profiles")
      .update({
        is_student: isStudent,
        student_verification_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId)
      .select()
      .single();

    if (error) throw error;

    await supabase.from("notifications").insert({
      user_id: profileId,
      title: isStudent ? "Student Status Approved 🎓" : "Student Verification Rejected ❌",
      message: isStudent 
        ? "Congratulations! Your student verification was approved. You can now use student discount deals."
        : "Your student verification proof was rejected. Please upload clear scans of your Aadhaar and ID.",
      type: "system",
    });

    res.status(200).json({
      success: true,
      message: `Student status verification completed: ${status}`,
      data,
    });
  } catch (error) {
    console.error("Admin error verifying student:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/admin/stats — Overall platform analytics dashboard stats
export const getAdminStats = async (req, res) => {
  try {
    const [bookingsRes, venuesRes, eventsRes, usersRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, total_amount, status, created_at, user:profiles(full_name), event:events(title)")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("venues").select("id, is_verified"),
      supabase.from("events").select("id, is_active"),
      supabase.from("profiles").select("id, role, is_student, student_verification_status"),
    ]);

    const bookings = bookingsRes.data || [];
    const venues = venuesRes.data || [];
    const events = eventsRes.data || [];
    const users = usersRes.data || [];

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((acc, b) => acc + Number(b.total_amount || 0), 0);
    const totalVenues = venues.length;
    const pendingVenues = venues.filter((v) => !v.is_verified).length;
    const totalEvents = events.length;
    const activeEvents = events.filter((e) => e.is_active).length;
    const totalUsers = users.length;
    const pendingStudents = users.filter((u) => u.student_verification_status === "pending").length;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalBookings,
        totalVenues,
        pendingVenues,
        totalEvents,
        activeEvents,
        totalUsers,
        pendingStudents,
        recentBookings: bookings.slice(0, 5),
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/admin/events — List all events for admin management
export const getAllEventsAdmin = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        venue:venues (id, name, city)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/admin/events/:id/toggle — Toggle event active status
export const toggleEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const { data, error } = await supabase
      .from("events")
      .update({ is_active })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/admin/users — List all users for admin management
export const getAllUsersAdmin = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/admin/users/:id/role — Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["customer", "venue_owner", "admin"].includes(role)) {
      return res.status(400).json({ success: false, error: "Invalid role" });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
