// ============================================
// 🔐 Auth Controller — Signup, Login, Profile
// ============================================
// 🧠 LEARN: Supabase handles auth for us!
// We don't need to hash passwords, manage sessions, or handle JWTs ourselves.
// Supabase Auth provides: signUp, signInWithPassword, signOut, getUser
// All we do is call these methods and return the results.

import supabase from "../config/supabase.js";

// POST /api/auth/signup
export const signup = async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    // Validation
    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        error: "Email, password, and full name are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters.",
      });
    }

    // 🧠 LEARN: Supabase signUp creates a user in auth.users
    // The raw_user_meta_data stores extra info like full_name
    // Our database trigger (handle_new_user) automatically creates
    // a profile row when a new auth user is created!
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        },
      },
    });

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      data: {
        user: data.user,
        session: data.session,
      },
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required.",
      });
    }

    // 🧠 LEARN: signInWithPassword verifies credentials
    // If correct, Supabase returns:
    // - user object (id, email, metadata)
    // - session object (access_token, refresh_token, expires_at)
    // The access_token is a JWT that the frontend stores and sends with every request
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "Logged in successfully!",
      data: {
        user: data.user,
        session: data.session,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(401).json({ success: false, error: error.message });
  }
};

// GET /api/auth/profile — Get logged-in user's profile
export const getProfile = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Get profile error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/auth/profile — Update profile
export const updateProfile = async (req, res) => {
  try {
    const { full_name, phone, avatar_url, college, student_id_url, aadhar_url, submit_verification } = req.body;

    const updateFields = {
      full_name,
      phone,
      avatar_url,
      updated_at: new Date().toISOString(),
    };

    if (submit_verification) {
      updateFields.college = college;
      updateFields.student_id_url = student_id_url;
      updateFields.aadhar_url = aadhar_url;
      updateFields.student_verification_status = "pending";
    } else if (req.body.is_student === false) {
      updateFields.college = null;
      updateFields.student_id_url = null;
      updateFields.aadhar_url = null;
      updateFields.student_verification_status = "not_submitted";
      updateFields.is_student = false;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updateFields)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "Profile updated!",
      data,
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
