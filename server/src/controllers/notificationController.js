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
      .eq("user_id", req.user.id); // Secure: user can only delete their own notifications

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
