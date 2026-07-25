// ============================================
// 🔔 Notification Controller — User Notifications & Alerts
// ============================================
import supabase from "../config/supabase.js";

// GET /api/notifications — Fetch all notifications for the logged-in user
export const getMyNotifications = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/notifications/mark-read — Mark all notifications for the user as read
export const markAllRead = async (req, res) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", req.user.id);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/notifications/:id — Delete a single notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "Notification cleared",
    });
  } catch (error) {
    console.error("Error deleting notification:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/notifications/remind — Create event start alert reminder
export const createEventReminder = async (req, res) => {
  try {
    const { event_id, event_title, reminder_hours = 2 } = req.body;
    const userId = req.user.id;

    if (!event_title) {
      return res.status(400).json({ success: false, error: "Event title is required" });
    }

    const payload = {
      user_id: userId,
      title: `⏰ Reminder Set: ${event_title}`,
      message: `You'll get an alert ${reminder_hours} hour(s) before the event begins! Get your squad ready. 🚀`,
      type: "event_reminder",
      link: `/events/${event_id}`,
      is_read: false,
      created_at: new Date().toISOString()
    };

    // Store in Supabase notifications table
    try {
      await supabase.from("notifications").insert(payload);
    } catch (dbErr) {
      console.warn("DB notification insert notice:", dbErr);
    }

    res.status(200).json({
      success: true,
      message: `Reminder set for ${reminder_hours} hour(s) before the event! 🔔`,
      data: payload
    });

  } catch (error) {
    console.error("Error setting event reminder:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to set event reminder" });
  }
};
