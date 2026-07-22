import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import api from "../lib/api";

function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, fetchProfile, signOut } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    const handleCallback = async () => {
      const role = searchParams.get("role") || "customer";

      // Fetch existing profile
      const profile = await fetchProfile(user.id);

      // If logging in/signing up as owner
      if (role === "venue_owner") {
        const pendingSetup = localStorage.getItem("pending_owner_setup");

        // 1. First-time OAuth signup (no profile exists yet)
        if (!profile && !pendingSetup) {
          // No setup details found, they tried to bypass OwnerSignup!
          await signOut();
          toast.error("Account not found. Please register and submit your business details first.");
          navigate("/owner/signup");
          return;
        }

        // 2. We have a pending setup, process it
        if (pendingSetup) {
          const setupData = JSON.parse(pendingSetup);

          // Update profile role to venue_owner in profiles table
          await supabase
            .from("profiles")
            .update({ role: "venue_owner" })
            .eq("id", user.id);

          await fetchProfile(user.id);

          try {
            // Save access token
            const session = (await supabase.auth.getSession()).data.session;
            if (session?.access_token) {
              localStorage.setItem("access_token", session.access_token);
            }

            // Create the venue entry directly
            await api.post("/venues", {
              name: setupData.businessName,
              address: setupData.businessAddress,
              city: setupData.businessCity,
              phone: setupData.ownerPhone,
              business_reg_no: setupData.businessRegNo,
              id_proof: setupData.ownerIdProof,
              category: "club", // default
              images: ["https://images.unsplash.com/photo-1566417713940-fe7c8460ffd3?w=1200"],
            });

            localStorage.removeItem("pending_owner_setup");
            toast.success("Registration complete! Welcome to the Partner Portal 🎉");
            navigate("/owner/dashboard");
          } catch (venueErr) {
            console.error("Failed to auto-create venue during callback:", venueErr);
            toast.error("Account created, but venue registration failed.");
            navigate("/owner/setup");
          }
          return;
        }

        // 3. Normal login (profile exists, no pending setup)
        // Check if venue exists
        const { data: venue } = await supabase
          .from("venues")
          .select("id")
          .eq("owner_id", user.id)
          .single();

        if (venue) {
          toast.success("Welcome back, Partner! 🌙");
          navigate("/owner/dashboard");
        } else {
          toast("Let's set up your venue details!", { icon: "🏢" });
          navigate("/owner/setup");
        }
      } else {
        toast.success("Welcome to AfterDark! 🌙");
        navigate("/");
      }
    };

    handleCallback();
  }, [user, loading]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "hsl(240 20% 4%)",
      color: "white",
      fontSize: "1.1rem",
    }}>
      <p>Signing you in...</p>
    </div>
  );
}

export default AuthCallback;
