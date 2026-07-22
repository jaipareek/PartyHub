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

    // 1. Verify squad exists and fetch booking details
    const { data: squad, error: squadErr } = await supabase
      .from("squads")
      .select("id, name, leader_id, total_amount, booking:bookings(id, quantity)")
      .eq("id", squadId)
      .single();

    if (squadErr || !squad) {
      return res.status(404).json({ success: false, error: "Squad not found" });
    }

    // 2. Validate squad capacity if there is a split checkout booking
    let shareAmount = 0;
    if (squad.booking) {
      const { count, error: countErr } = await supabase
        .from("squad_members")
        .select("*", { count: "exact", head: true })
        .eq("squad_id", squadId);

      if (countErr) throw countErr;

      if (count >= squad.booking.quantity) {
        return res.status(400).json({
          success: false,
          error: `Squad is full. This booking split is limited to a maximum of ${squad.booking.quantity} members.`
        });
      }
      shareAmount = parseFloat(squad.total_amount || 0) / squad.booking.quantity;
    }

    // 3. Insert member with computed share amount
    const { data: member, error: memberErr } = await supabase
      .from("squad_members")
      .insert({
        squad_id: squadId,
        user_id: userId,
        status: "accepted", // Auto-accept to make coordination simple
        amount_owed: shareAmount,
        has_paid: false
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

    // Fetch profile of joining user
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    if (squad.leader_id !== userId) {
      await supabase.from("notifications").insert({
        user_id: squad.leader_id,
        title: "New Squad Member! 👥",
        message: `${profile?.full_name || "A friend"} joined your squad "${squad.name}".`,
        type: "squad_invite",
        related_id: squadId,
        related_type: "squad",
      });
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

    // 1. Get squad and associated event/venue/booking details
    const { data: squad, error: squadErr } = await supabase
      .from("squads")
      .select(`
        *,
        leader:profiles (id, full_name, email),
        event:events (
          id, title, date, start_time, poster_url,
          venue:venues (id, name, city)
        ),
        booking:bookings (
          id, quantity, tier_type, total_amount, status, payment_status, booking_code
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
        id, status, joined_at, amount_owed, has_paid,
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
      has_booked: bookingMap.has(m.user.id) || m.has_paid,
      booking_code: bookingMap.get(m.user.id) || (m.has_paid ? squad.booking?.booking_code : null) || null,
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

// GET /api/squads/my/active — Get active & archived squads for logged-in user with 48h auto-clean
export const getMySquads = async (req, res) => {
  try {
    const userId = req.user.id;
    const { include_archived } = req.query;

    // 1. Fetch squad memberships for the user
    const { data: memberships, error: memberErr } = await supabase
      .from("squad_members")
      .select("squad_id")
      .eq("user_id", userId);

    if (memberErr) throw memberErr;
    if (!memberships || memberships.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const squadIds = memberships.map((m) => m.squad_id);

    // 2. Fetch detailed squad data
    const { data: squads, error: squadsErr } = await supabase
      .from("squads")
      .select(`
        *,
        leader:profiles (id, full_name, email, avatar_url),
        event:events (
          id, title, date, start_time, poster_url,
          venue:venues (id, name, city)
        )
      `)
      .in("id", squadIds)
      .order("updated_at", { ascending: false });

    if (squadsErr) throw squadsErr;

    // 3. Evaluate 2-Day (48 Hour) Inactivity / Expiry Auto-Archive logic
    const now = new Date();
    const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

    const enrichedSquads = await Promise.all(
      squads.map(async (squad) => {
        // Fetch last message for chat preview
        const { data: lastMsg } = await supabase
          .from("squad_messages")
          .select("id, message, created_at, user:profiles(full_name)")
          .eq("squad_id", squad.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Determine last activity time (event date or last message date or squad update date)
        const eventDate = squad.event?.date ? new Date(squad.event.date) : new Date(squad.updated_at);
        const lastMsgDate = lastMsg?.created_at ? new Date(lastMsg.created_at) : null;
        const mostRecentDate = lastMsgDate && lastMsgDate > eventDate ? lastMsgDate : eventDate;

        const timeDiff = now - mostRecentDate;
        const isExpired = timeDiff > TWO_DAYS_MS;

        // Auto update is_active in database if expired
        if (isExpired && squad.is_active) {
          await supabase
            .from("squads")
            .update({ is_active: false })
            .eq("id", squad.id);
          squad.is_active = false;
        }

        return {
          ...squad,
          is_archived: !squad.is_active || isExpired,
          last_message: lastMsg || null,
        };
      })
    );

    // Filter based on query unless include_archived=true
    const result = include_archived === "true" 
      ? enrichedSquads 
      : enrichedSquads.filter((s) => !s.is_archived);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error getting active squads:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/squads/:squadId/pay-share — Complete payment for a member's share
export const payMemberShare = async (req, res) => {
  try {
    const { squadId } = req.params;
    const userId = req.user.id;
    const { cardNumber, expiry, cvv } = req.body;

    if (!cardNumber || !expiry || !cvv) {
      return res.status(400).json({ success: false, error: "Payment details are required" });
    }

    // 1. Verify squad exists and fetch booking details
    const { data: squad, error: squadErr } = await supabase
      .from("squads")
      .select("*, booking:bookings(*)")
      .eq("id", squadId)
      .single();

    if (squadErr || !squad) {
      return res.status(404).json({ success: false, error: "Squad not found" });
    }

    if (!squad.booking) {
      return res.status(400).json({ success: false, error: "This squad does not have an active split payment checkout" });
    }

    // 2. Fetch the squad member record
    const { data: member, error: memberErr } = await supabase
      .from("squad_members")
      .select("*")
      .eq("squad_id", squadId)
      .eq("user_id", userId)
      .single();

    if (memberErr || !member) {
      return res.status(400).json({ success: false, error: "You are not a member of this squad" });
    }

    if (member.has_paid) {
      return res.status(400).json({ success: false, error: "You have already paid your share for this booking" });
    }

    // 3. Mark the member as paid
    const { error: updateErr } = await supabase
      .from("squad_members")
      .update({ has_paid: true })
      .eq("id", member.id);

    if (updateErr) throw updateErr;

    // 4. Fetch all members to evaluate payment progress
    const { data: allMembers, error: fetchMembersErr } = await supabase
      .from("squad_members")
      .select("*")
      .eq("squad_id", squadId);

    if (fetchMembersErr) throw fetchMembersErr;

    const paidCount = allMembers.filter(m => m.has_paid).length;
    const totalSlots = squad.booking.quantity;

    // If all slots have paid, confirm the booking!
    let bookingConfirmed = false;
    if (paidCount === totalSlots) {
      const { error: confirmErr } = await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          payment_status: "paid"
        })
        .eq("id", squad.booking.id);

      if (confirmErr) throw confirmErr;
      bookingConfirmed = true;

      // Create notification entries for all squad members
      const notifications = allMembers.map(m => ({
        user_id: m.user_id,
        title: "Crew Booking Confirmed! 🎉",
        message: `Your squad "${squad.name}" split payment is complete! Your tickets are now active.`,
        type: "booking",
        related_id: squad.booking.id,
        related_type: "booking"
      }));

      await supabase.from("notifications").insert(notifications);
    } else {
      // Notify the squad leader about progress
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      if (squad.leader_id !== userId) {
        await supabase.from("notifications").insert({
          user_id: squad.leader_id,
          title: "Squad Payment Received! 💸",
          message: `${profile?.full_name || "A member"} paid their share. Split progress: ${paidCount}/${totalSlots} paid.`,
          type: "payment",
          related_id: squadId,
          related_type: "squad"
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Share payment successful! 💳",
      data: {
        has_paid: true,
        booking_confirmed: bookingConfirmed,
        progress: {
          paid_count: paidCount,
          total_slots: totalSlots
        }
      }
    });
  } catch (error) {
    console.error("Error paying squad member share:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
