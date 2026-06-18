import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

// 🧠 LEARN: React Context
// Context lets you share data across ALL components without prop drilling
// Instead of passing user={user} through 10 levels of components,
// any component can just call useAuth() to get the current user

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🧠 LEARN: getSession checks if user is already logged in
    // (e.g., they refreshed the page but their session is still valid)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 🧠 LEARN: onAuthStateChange is a LISTENER
    // It fires whenever auth state changes:
    // - User logs in → SIGNED_IN event
    // - User logs out → SIGNED_OUT event
    // - Token refreshes → TOKEN_REFRESHED event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => subscription.unsubscribe();
  }, []);

  // ── Auth Methods ──

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Value object shared with all consumers of this context
  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
