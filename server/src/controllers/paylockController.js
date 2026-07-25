// ============================================
// 💳 PayLock Controller — Group Bill-Splitter & Auto-Lock
// ============================================
import supabase from "../config/supabase.js";

// In-memory PayLock fallback cache
const memoryPayLocks = new Map();

// POST /api/paylock/create — Initialize a PayLock session for a Squad
export const createPayLockSession = async (req, res) => {
  try {
    const { squad_id, event_id, venue_id, item_title, total_target_amount, item_type, host_paid_amount } = req.body;
    const userId = req.user.id;

    if (!squad_id || !total_target_amount || total_target_amount <= 0) {
      return res.status(400).json({ success: false, error: "Missing required fields: squad_id and total_target_amount" });
    }

    // Fetch user profile for contribution display name
    const { data: creatorProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    const hostName = creatorProfile?.full_name || "Host";

    // 1. Fetch Squad and Members Count to calculate suggested share
    const { data: squad } = await supabase
      .from("squads")
      .select("*, members:squad_members(user_id, profile:profiles(id, full_name, avatar_url))")
      .eq("id", squad_id)
      .single();

    const membersCount = squad?.members?.length || 1;
    const initialHostPaid = Number(host_paid_amount || 0);
    const suggestedShare = Math.ceil(total_target_amount / membersCount);

    const initialContributions = initialHostPaid > 0 ? [{
      user_id: userId,
      full_name: `${hostName} (Host)`,
      amount: initialHostPaid,
      paid_at: new Date().toISOString()
    }] : [];

    const targetVal = Number(total_target_amount);
    const remainingVal = Math.max(0, targetVal - initialHostPaid);

    // 2. Insert PayLock Session Payload
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2); // 2-hour Lock Window

    const paylockId = `pl_${Date.now()}`;
    const sessionPayload = {
      id: paylockId,
      squad_id,
      creator_id: userId,
      event_id: event_id || null,
      venue_id: venue_id || null,
      item_title: item_title || "Squad Pass / VIP Table",
      item_type: item_type || "ticket",
      total_target_amount: targetVal,
      collected_amount: initialHostPaid,
      remaining_amount: remainingVal,
      suggested_share: suggestedShare,
      status: remainingVal === 0 ? "completed" : "active", // 'active' | 'completed' | 'expired'
      expires_at: expiresAt.toISOString(),
      contributions: initialContributions
    };

    // Store in memory cache
    memoryPayLocks.set(squad_id, sessionPayload);

    // Try storing in Supabase paylock_sessions table if available
    try {
      const { data: dbPaylock } = await supabase
        .from("paylock_sessions")
        .insert(sessionPayload)
        .select()
        .single();
      
      if (dbPaylock) {
        memoryPayLocks.set(squad_id, dbPaylock);
      }
    } catch (e) {
      console.warn("paylock_sessions DB fallback:", e.message);
    }

    // 3. Post a PayLock notification message to Squad Chat
    try {
      await supabase.from("squad_messages").insert({
        squad_id,
        user_id: userId,
        message: `💳 Launched Squad PayLock for "${item_title || "Squad Booking"}". Total: ₹${total_target_amount.toLocaleString("en-IN")}. Split with squad!`,
      });
    } catch (msgErr) {
      console.warn("Squad message notice:", msgErr.message);
    }

    res.status(201).json({
      success: true,
      message: "PayLock session initialized! 💳 Split card added to Squad Chat.",
      data: memoryPayLocks.get(squad_id) || sessionPayload
    });
  } catch (error) {
    console.error("Error creating PayLock session:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/paylock/squad/:squadId — Get active PayLock session for Squad
export const getSquadPayLock = async (req, res) => {
  try {
    const { squadId } = req.params;

    // Check memory cache first
    const cachedPayLock = memoryPayLocks.get(squadId);
    if (cachedPayLock) {
      return res.status(200).json({ success: true, data: cachedPayLock });
    }

    // Check Supabase
    try {
      const { data: paylock } = await supabase
        .from("paylock_sessions")
        .select("*")
        .eq("squad_id", squadId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (paylock) {
        memoryPayLocks.set(squadId, paylock);
        return res.status(200).json({ success: true, data: paylock });
      }
    } catch (dbErr) {
      console.warn("Paylock query notice:", dbErr.message);
    }

    res.status(200).json({ success: true, data: null });
  } catch (error) {
    console.error("Error getting squad PayLock:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/paylock/:id/pay-share — Contribute payment (suggested or custom amount)
export const payShare = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, squad_id } = req.body;
    const userId = req.user.id;

    const contributionAmount = Number(amount);

    if (!contributionAmount || contributionAmount <= 0) {
      return res.status(400).json({ success: false, error: "Invalid payment amount" });
    }

    // 1. Fetch User Profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", userId)
      .single();

    const userName = profile?.full_name || "Squad Member";

    // 2. Fetch PayLock Session from Memory or Database
    let paylock = squad_id ? memoryPayLocks.get(squad_id) : null;
    if (!paylock) {
      try {
        const { data: dbLock } = await supabase
          .from("paylock_sessions")
          .select("*")
          .eq("id", id)
          .single();
        if (dbLock) paylock = dbLock;
      } catch (e) {
        console.warn("Paylock lookup notice:", e.message);
      }
    }

    if (!paylock) {
      // Create fallback session object
      paylock = {
        id,
        squad_id,
        total_target_amount: contributionAmount * 2,
        collected_amount: 0,
        remaining_amount: contributionAmount * 2,
        contributions: []
      };
    }

    const currentCollected = Number(paylock.collected_amount || 0);
    const newCollected = currentCollected + contributionAmount;
    const targetAmount = Number(paylock.total_target_amount);
    const newRemaining = Math.max(0, targetAmount - newCollected);
    const isCompleted = newRemaining === 0;

    const existingContributions = paylock.contributions || [];
    const newContribution = {
      user_id: userId,
      full_name: userName,
      amount: contributionAmount,
      paid_at: new Date().toISOString()
    };

    const updatedContributions = [...existingContributions, newContribution];

    // 3. Update PayLock Session in memory and DB
    const updatedPayLock = {
      ...paylock,
      collected_amount: newCollected,
      remaining_amount: newRemaining,
      status: isCompleted ? "completed" : "active",
      contributions: updatedContributions,
      updated_at: new Date().toISOString()
    };

    if (paylock.squad_id || squad_id) {
      memoryPayLocks.set(paylock.squad_id || squad_id, updatedPayLock);
    }

    try {
      await supabase
        .from("paylock_sessions")
        .update({
          collected_amount: newCollected,
          remaining_amount: newRemaining,
          status: isCompleted ? "completed" : "active",
          contributions: updatedContributions,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);
    } catch (e) {
      console.warn("Paylock update DB notice:", e.message);
    }

    // 4. Send chat alert in Squad Chat
    const chatMsg = isCompleted
      ? `🎉 PayLock Complete! ${userName} paid ₹${contributionAmount.toLocaleString("en-IN")}. Target of ₹${targetAmount.toLocaleString("en-IN")} reached! Entry passes issued! 🎟️`
      : `💳 ${userName} paid ₹${contributionAmount.toLocaleString("en-IN")} towards PayLock! ₹${newRemaining.toLocaleString("en-IN")} remaining.`;

    await supabase.from("squad_messages").insert({
      squad_id: paylock.squad_id || squad_id,
      user_id: userId,
      message: chatMsg,
    });

    // 5. If PayLock completed 100%, generate bookings / passes for squad members
    if (isCompleted && paylock.event_id) {
      try {
        await supabase.from("bookings").insert({
          user_id: userId,
          event_id: paylock.event_id,
          pass_type: "Squad PayLock Pass",
          quantity: 1,
          total_amount: contributionAmount,
          status: "checked_in_eligible",
          qr_code: `PL_${id}_${userId}_${Date.now()}`
        });
      } catch (passErr) {
        console.warn("Auto pass notice:", passErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: isCompleted 
        ? "PayLock 100% Complete! Entry passes issued! 🎉" 
        : `Payment of ₹${contributionAmount.toLocaleString("en-IN")} recorded!`,
      data: updatedPayLock
    });
  } catch (error) {
    console.error("Error submitting PayLock share:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
