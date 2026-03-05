import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isCommercial: boolean;
  isCs: boolean;
  isOnboarding: boolean;
  isLoading: boolean;
  sessionExpired: boolean;
  dismissSessionExpired: () => void;
  refreshSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: { full_name?: string; phone?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isCommercial, setIsCommercial] = useState(false);
  const [isCs, setIsCs] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const previousUserRef = useRef<string | null>(null);
  const rolesCheckedRef = useRef(false);

  const checkUserRoles = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      
      if (!error && data) {
        const roles = data.map(r => r.role);
        setIsAdmin(roles.includes("admin"));
        setIsSuperAdmin(roles.includes("super_admin"));
        setIsCommercial(roles.includes("commercial"));
        setIsCs(roles.includes("cs"));
        setIsOnboarding(roles.includes("onboarding"));
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsCommercial(false);
        setIsCs(false);
        setIsOnboarding(false);
      }
    } catch {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setIsCommercial(false);
      setIsCs(false);
      setIsOnboarding(false);
    }
    rolesCheckedRef.current = true;
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setSessionExpired(false);
      }
    } catch (err) {
      console.error("Failed to refresh session:", err);
    }
  }, []);

  const dismissSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    // 1. Set up listener FIRST (catches events during getSession)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;

        // Detect session expiry: user was logged in, now signed out unexpectedly
        if (event === "SIGNED_OUT" && previousUserRef.current) {
          setSessionExpired(true);
        }

        if (event === "TOKEN_REFRESHED") {
          setSessionExpired(false);
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        const currentUserId = currentSession?.user?.id ?? null;
        
        if (currentUserId && currentUserId !== previousUserRef.current) {
          previousUserRef.current = currentUserId;
          // Defer to avoid deadlock in onAuthStateChange callback
          setTimeout(() => {
            if (isMounted) checkUserRoles(currentUserId);
          }, 0);
        } else if (!currentUserId) {
          previousUserRef.current = null;
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setIsCommercial(false);
          setIsCs(false);
          setIsOnboarding(false);
        }

        // Only set loading false after initial load
        if (isLoading) setIsLoading(false);
      }
    );

    // 2. Get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user) {
        previousUserRef.current = initialSession.user.id;
        await checkUserRoles(initialSession.user.id);
      }
      
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = async (email: string, password: string) => {
    setSessionExpired(false);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, metadata?: { full_name?: string; phone?: string }) => {
    const postRedirect = localStorage.getItem("postLoginRedirect");
    const isValidRedirect = postRedirect && postRedirect.startsWith("/") && !postRedirect.startsWith("//");
    const redirectUrl = isValidRedirect
      ? `${window.location.origin}/login?redirect=${encodeURIComponent(postRedirect)}`
      : `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata || {},
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    previousUserRef.current = null;
    setSessionExpired(false);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ 
      user, session, isAdmin, isSuperAdmin, isCommercial, isCs, isOnboarding, 
      isLoading, sessionExpired, dismissSessionExpired, refreshSession,
      signIn, signUp, signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
