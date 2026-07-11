// ============================================
// 👥 Squad Controller — Friends Night Out Coordination
// ============================================
import supabase from "../config/supabase.js";

// POST /api/squads — Create a new squad for an event
export const createSquad = async (req, res) => {
  try {
    const { name, event_id } = req.body;
    const userId = req.user.id;

    if (!name || !event_id) {
      return res.status(400).json({ success: false, error: "Squad name and event ID are required" });
    }

    // 1. Create the squad
    const { data: squad, error: squadErr } = await supabase
      .from("squads")
      .insert({
        name,
        leader_id: userId,
        event_id,
        is_active: true,
      })
      .select()
      .single();

    if (squadErr) throw squadErr;

    // 2. Automatically add the squad creator as an accepted member
    const { error: memberErr } = await supabase
      .from("squad_members")
      .insert({
        squad_id: squad.id,
        user_id: userId,
        status: "accepted",
      });

    if (memberErr) throw memberErr;

    res.status(201).json({
      success: true,
      message: "Squad created successfully! 🍻",
      data: squad,
    });
  } catch (error) {
    console.error("Error creating squad:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/squads/:squadId/join — Join an existing squad
export const joinSquad = async (req, res) => {
  try {
    const { squadId } = req.params;
    const userId = req.user.id;

    // 1. Verify squad exists
    const { data: squad, error: squadErr } = await supabase
      .from("squads")
      .select("id")
      .eq("id", squadId)
      .single();

    if (squadErr || !squad) {
      return res.status(404).json({ success: false, error: "Squad not found" });
    }

    // 2. Insert member
    const { data: member, error: memberErr } = await supabase
      .from("squad_members")
      .insert({
        squad_id: squadId,
        user_id: userId,
        status: "accepted", // Auto-accept to make coordination simple
      })
      .select()
      .single();

    if (memberErr) {
      if (memberErr.code === "23505") {
        return res
          .status(400)
          .json({ success: false, error: "You are already a member of this squad" });
      }
      throw memberErr;
    }

    res.status(200).json({
      success: true,
      message: "Welcome to the squad! 🎉",
      data: member,
    });
  } catch (error) {
    console.error("Error joining squad:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/squads/:squadId — Get detailed status of a squad and members ticketing checklist
export const getSquadDetails = async (req, res) => {
  try {
    const { squadId } = req.params;

    // 1. Get squad and associated event/venue details
    const { data: squad, error: squadErr } = await supabase
      .from("squads")
      .select(`
        *,
        leader:profiles (id, full_name, email),
        event:events (
          id, title, date, start_time, poster_url,
          venue:venues (id, name, city)
        )
      `)
      .eq("id", squadId)
      .single();

    if (squadErr || !squad) {
      return res.status(404).json({ success: false, error: "Squad not found" });
    }

    // 2. Fetch squad members profiles
    const { data: members, error: membersErr } = await supabase
      .from("squad_members")
      .select(`
        id, status, joined_at,
        user:profiles (id, full_name, email, avatar_url)
      `)
      .eq("squad_id", squadId);

    if (membersErr) throw membersErr;

    // 3. For each member, check if they have a confirmed booking for this squad's event
    const memberIds = members.map((m) => m.user.id);
    const { data: bookings, error: bookingsErr } = await supabase
      .from("bookings")
      .select("user_id, booking_code")
      .eq("event_id", squad.event_id)
      .in("user_id", memberIds)
      .eq("status", "confirmed");

    if (bookingsErr) throw bookingsErr;

    const bookingMap = new Map(bookings.map((b) => [b.user_id, b.booking_code]));

    const enrichedMembers = members.map((m) => ({
      ...m,
      has_booked: bookingMap.has(m.user.id),
      booking_code: bookingMap.get(m.user.id) || null,
    }));

    res.status(200).json({
      success: true,
      data: {
        squad,
        members: enrichedMembers,
      },
    });
  } catch (error) {
    console.error("Error getting squad details:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/squads/event/:eventId — Get list of public squads coordinating for an event
export const getEventSquads = async (req, res) => {
  try {
    const { eventId } = req.params;

    const { data: squads, error } = await supabase
      .from("squads")
      .select(`
        *,
        leader:profiles (full_name, avatar_url),
        members:squad_members (id)
      `)
      .eq("event_id", eventId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Format count
    const formatted = squads.map((s) => ({
      id: s.id,
      name: s.name,
      leader_name: s.leader?.full_name,
      leader_avatar: s.leader?.avatar_url,
      member_count: s.members ? s.members.length : 0,
      created_at: s.created_at,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Error getting event squads:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/squads/:squadId/messages — Fetch all messages for a squad
export const getSquadMessages = async (req, res) => {
  try {
    const { squadId } = req.params;

    const { data, error } = await supabase
      .from("squad_messages")
      .select(`
        *,
        user:profiles (id, full_name, avatar_url, role)
      `)
      .eq("squad_id", squadId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Error getting squad messages:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/squads/:squadId/messages — Post a new message
export const sendSquadMessage = async (req, res) => {
  try {
    const { squadId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: "Message content is required" });
    }

    // Verify user is in the squad
    const { data: member, error: memberErr } = await supabase
      .from("squad_members")
      .select("id")
      .eq("squad_id", squadId)
      .eq("user_id", userId)
      .single();

    // Or if they are the leader of the squad
    const { data: squad, error: squadErr } = await supabase
      .from("squads")
      .select("id, leader_id")
      .eq("id", squadId)
      .single();

    if ((memberErr || !member) && (squadErr || squad?.leader_id !== userId)) {
      return res.status(403).json({ success: false, error: "You are not a member of this squad" });
    }

    const { data, error } = await supabase
      .from("squad_messages")
      .insert({
        squad_id: squadId,
        user_id: userId,
        message: message.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error("Error posting squad message:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/squads/:squadId/messages/:messageId/pin — Pin/unpin a message
export const togglePinMessage = async (req, res) => {
  try {
    const { squadId, messageId } = req.params;
    const { is_pinned } = req.body;
    const userId = req.user.id;

    // 1. Verify user is leader of the squad
    const { data: squad, error: squadErr } = await supabase
      .from("squads")
      .select("leader_id")
      .eq("id", squadId)
      .single();

    if (squadErr || !squad) {
      return res.status(404).json({ success: false, error: "Squad not found" });
    }

    if (squad.leader_id !== userId) {
      return res.status(403).json({ success: false, error: "Only the squad host/leader can pin announcements" });
    }

    // If we are pinning a message, unpin all other messages in this squad first
    if (is_pinned) {
      await supabase
        .from("squad_messages")
        .update({ is_pinned: false })
        .eq("squad_id", squadId);
    }

    const { data, error } = await supabase
      .from("squad_messages")
      .update({ is_pinned })
      .eq("id", messageId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, message: is_pinned ? "Message pinned as active announcement!" : "Message unpinned", data });
  } catch (error) {
    console.error("Error pinning squad message:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
