import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HiUser, HiAcademicCap, HiCloudArrowUp, HiCheckCircle } from "react-icons/hi2";
import api from "../lib/api";
import toast from "react-hot-toast";
import "./UserProfile.css";

function UserProfile() {
  const { user, profile, fetchProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [isStudent, setIsStudent] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Mock file upload states
  const [uploadingId, setUploadingId] = useState(false);
  const [idDocName, setIdDocName] = useState("");
  
  const [uploadingAadhar, setUploadingAadhar] = useState(false);
  const [aadharDocName, setAadharDocName] = useState("");

  const [verificationStatus, setVerificationStatus] = useState("not_submitted");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }

    if (profile) {
      setFullName(profile.full_name || "");
      setCollege(profile.college || "");
      setIsStudent(profile.is_student || false);
      setVerificationStatus(profile.student_verification_status || "not_submitted");
      
      if (profile.student_id_url) {
        setIdDocName("student_id_card.png");
      }
      if (profile.aadhar_url) {
        setAadharDocName("aadhar_card.pdf");
      }
    }
  }, [user, profile, authLoading, navigate]);

  const handleToggleStudent = () => {
    // Only allow toggle if not pending/approved
    if (verificationStatus === "pending" || verificationStatus === "approved") {
      toast.error("You cannot alter student status while verification is pending or approved.");
      return;
    }
    setIsStudent(!isStudent);
    if (isStudent) {
      setIdDocName("");
      setAadharDocName("");
    }
  };

  const handleMockUploadId = () => {
    if (uploadingId) return;
    setUploadingId(true);
    toast.loading("Uploading ID card scan...", { id: "uploadId" });
    
    setTimeout(() => {
      setIdDocName("student_id_scan.png");
      setUploadingId(false);
      toast.success("Student ID scan uploaded successfully!", { id: "uploadId" });
    }, 1200);
  };

  const handleMockUploadAadhar = () => {
    if (uploadingAadhar) return;
    setUploadingAadhar(true);
    toast.loading("Uploading Aadhaar card scan...", { id: "uploadAadhar" });
    
    setTimeout(() => {
      setAadharDocName("aadhar_card_scan.pdf");
      setUploadingAadhar(false);
      toast.success("Aadhaar card scan uploaded successfully!", { id: "uploadAadhar" });
    }, 1200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isStudent && (!idDocName || !aadharDocName)) {
      toast.error("Please upload both your Student ID scan and Aadhaar Card scan");
      return;
    }

    try {
      setSaving(true);
      const res = await api.put("/auth/profile", {
        full_name: fullName,
        college: isStudent ? college : "",
        student_id_url: isStudent ? `https://supabase.co/storage/id_${user.id}.png` : null,
        aadhar_url: isStudent ? `https://supabase.co/storage/aadhar_${user.id}.pdf` : null,
        submit_verification: isStudent,
        is_student: isStudent ? undefined : false,
      });

      if (res.data?.success) {
        toast.success(isStudent ? "Verification request submitted! 📋" : "Profile saved! 🎉");
        await fetchProfile(user.id); // Refresh global profile context
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error(err.response?.data?.error || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (fullName) {
      return fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "?";
  };

  if (authLoading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-card__avatar-section">
            <div className="profile-card__avatar">{getInitials()}</div>
            <h2 className="profile-card__name">{fullName || "User Profile"}</h2>
            <p className="profile-card__email">{user?.email}</p>
            <span style={{ fontSize: "0.72rem", textTransform: "uppercase", background: "rgba(124, 92, 252, 0.08)", color: "var(--primary-light)", border: "1px solid rgba(124, 92, 252, 0.2)", padding: "4px 10px", borderRadius: "6px", display: "inline-block", marginTop: "10px", fontWeight: 700 }}>
              {profile?.role === "customer" ? "Verified Customer" : profile?.role === "admin" ? "Platform Admin" : "Venue Partner"}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="profile-form__field">
              <label>Full Name *</label>
              <input
                type="text"
                placeholder="Your Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            {/* Student Deal Verification Box */}
            <div className="student-verification">
              <div className="student-verification__toggle">
                <div className="student-verification__label-group">
                  <span className="student-verification__title">Verify Student Status</span>
                  <span className="student-verification__desc">Claims student deal discounts (up to 50%) during checkout.</span>
                </div>
                <button
                  type="button"
                  className={`student-verification__switch ${isStudent ? "active" : ""}`}
                  onClick={handleToggleStudent}
                  disabled={verificationStatus === "pending" || verificationStatus === "approved"}
                >
                  <div className="student-verification__handle" />
                </button>
              </div>

              {/* Status alerts */}
              {verificationStatus === "pending" && (
                <div style={{ marginTop: "16px", padding: "12px 16px", background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "8px", fontSize: "0.82rem", color: "var(--warning)", display: "flex", gap: "10px", alignItems: "center" }}>
                  <span>⏳ Verification pending admin review. We are checking your ID Card and Aadhaar Proof scans.</span>
                </div>
              )}
              {verificationStatus === "approved" && (
                <div style={{ marginTop: "16px", padding: "12px 16px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "8px", fontSize: "0.82rem", color: "#10b981", display: "flex", gap: "10px", alignItems: "center" }}>
                  <span>🎓 Verified Student! You are now eligible for all student deal discounts during checkout.</span>
                </div>
              )}
              {verificationStatus === "rejected" && (
                <div style={{ marginTop: "16px", padding: "12px 16px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", fontSize: "0.82rem", color: "#ef4444", display: "flex", gap: "10px", alignItems: "center" }}>
                  <span>❌ Verification rejected. Please re-upload clear photos of your Student ID and Aadhaar card.</span>
                </div>
              )}

              {isStudent && (
                <div style={{ marginTop: "20px" }}>
                  <div className="profile-form__field" style={{ marginBottom: "16px" }}>
                    <label>College / University *</label>
                    <input
                      type="text"
                      placeholder="e.g. IIT Delhi, Christ University"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      required
                      disabled={verificationStatus === "pending" || verificationStatus === "approved"}
                    />
                  </div>

                  {/* 1. Student ID Upload */}
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: "600", textTransform: "uppercase", color: "hsl(var(--muted))", letterSpacing: "0.5px", display: "block", marginBottom: "8px", textAlign: "left" }}>
                      Upload Student ID Photo *
                    </label>
                    {idDocName ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border)", padding: "12px", borderRadius: "8px" }}>
                        <span style={{ color: "white", fontSize: "0.82rem" }}>📄 {idDocName}</span>
                        {(verificationStatus === "not_submitted" || verificationStatus === "rejected") && (
                          <button
                            type="button"
                            onClick={() => setIdDocName("")}
                            style={{ background: "none", border: "none", color: "hsl(var(--muted))", fontSize: "0.8rem", cursor: "pointer" }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="student-upload" onClick={handleMockUploadId}>
                        <HiCloudArrowUp className="student-upload__icon" />
                        <span className="student-upload__text">Upload Student ID scan</span>
                      </div>
                    )}
                  </div>

                  {/* 2. Aadhaar Upload */}
                  <div style={{ marginBottom: "10px" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: "600", textTransform: "uppercase", color: "hsl(var(--muted))", letterSpacing: "0.5px", display: "block", marginBottom: "8px", textAlign: "left" }}>
                      Upload Aadhaar / Digilocker Proof *
                    </label>
                    {aadharDocName ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border)", padding: "12px", borderRadius: "8px" }}>
                        <span style={{ color: "white", fontSize: "0.82rem" }}>📄 {aadharDocName}</span>
                        {(verificationStatus === "not_submitted" || verificationStatus === "rejected") && (
                          <button
                            type="button"
                            onClick={() => setAadharDocName("")}
                            style={{ background: "none", border: "none", color: "hsl(var(--muted))", fontSize: "0.8rem", cursor: "pointer" }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="student-upload" onClick={handleMockUploadAadhar}>
                        <HiCloudArrowUp className="student-upload__icon" />
                        <span className="student-upload__text">Upload Aadhaar scan / PDF</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="profile-form__submit"
              disabled={saving || verificationStatus === "pending" || verificationStatus === "approved"}
            >
              <HiAcademicCap style={{ fontSize: "1.2rem" }} />
              {saving
                ? "Submitting..."
                : isStudent && verificationStatus === "not_submitted"
                ? "Submit for Verification"
                : "Save Profile Details"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
