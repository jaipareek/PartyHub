// ============================================
// 🔐 Auth Middleware — Verify Supabase JWT Token
// ============================================
// 🧠 LEARN: Middleware = a function that runs BEFORE your route handler
//
// When a user logs in, Supabase gives them a JWT (JSON Web Token)
// The frontend sends this token in the Authorization header:
//   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
//
// This middleware:
// 1. Extracts the token from the header
// 2. Asks Supabase to verify it (is it valid? is it expired?)
// 3. If valid → attaches the user to req.user and calls next()
// 4. If invalid → sends 401 Unauthorized

import supabase from "../config/supabase.js";

export const protect = async (req, res, next) => {
  try {
    // Step 1: Get the token from the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated. Please log in.",
      });
    }

    const token = authHeader.split(" ")[1];

    // Step 2: Verify the token with Supabase
    // getUser() validates the JWT and returns the user if valid
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired token. Please log in again.",
      });
    }

    // Step 3: Attach user to request object
    // Now any route handler can access req.user
    req.user = data.user;

    // Step 4: Continue to the next middleware/route handler
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    res.status(500).json({ success: false, error: "Authentication failed" });
  }
};

// 🧠 LEARN: Role-based access control
// Some routes should only be accessible by admins or venue owners
// This middleware checks if the logged-in user has the required role
export const authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      // Get the user's profile to check their role
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", req.user.id)
        .single();

      if (error || !profile) {
        return res.status(403).json({
          success: false,
          error: "Profile not found.",
        });
      }

      if (!roles.includes(profile.role)) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Required role: ${roles.join(" or ")}`,
        });
      }

      req.userRole = profile.role;
      next();
    } catch (error) {
      res.status(500).json({ success: false, error: "Authorization failed" });
    }
  };
};
