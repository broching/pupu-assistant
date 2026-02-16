"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface UserContextType {
  user: User | null;
  displayName: string | null;
  session: Session | null;
  isLoading: boolean;
  tour: boolean | undefined;        // 🔥 undefined = not loaded yet
  tourLoaded: boolean;              // 🔥 explicit loading flag
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userUpdates: Partial<User>) => void;
  handleCompleteTour: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [displayName, setDisplayName] = useState<string | null>(null);

  // 🔥 IMPORTANT CHANGES
  const [tour, setTour] = useState<boolean | undefined>(undefined);
  const [tourLoaded, setTourLoaded] = useState(false);

  // ============================================
  // INITIAL SESSION + USER FETCH
  // ============================================

  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true);

      const { data } = await supabase.auth.getSession();
      const activeSession = data.session ?? null;

      setSession(activeSession);
      setUser(activeSession?.user ?? null);

      if (!activeSession?.access_token) {
        setIsLoading(false);
        setTourLoaded(true);
        return;
      }

      try {
        const res = await fetch("/api/user", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeSession.access_token}`,
          },
        });

        const userData = await res.json();

        setDisplayName(userData.user.name);
        setTour(userData.user.tour);      // 🔥 set real value
      } catch (err) {
        console.error("Failed to fetch /api/user:", err);
      } finally {
        setTourLoaded(true);              // 🔥 mark tour finalized
        setIsLoading(false);
      }
    };

    fetchSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: any, newSession: any) => {
        setSession(newSession ?? null);
        setUser(newSession?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // ============================================
  // COMPLETE TOUR
  // ============================================

  const handleCompleteTour = async () => {
    if (!session?.access_token) {
      console.error("No access token found");
      return;
    }

    try {
      const response = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tour: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update tour status");
      }

      // 🔥 Update locally so UI updates immediately
      setTour(true);

      console.log("Tour marked as completed");
    } catch (error) {
      console.error("Error updating tour:", error);
    }
  };

  // ============================================
  // LOGIN
  // ============================================

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setUser(data.user);
      setSession(data.session);

      toast.success("Welcome Back!", {
        description: "You Have Been Logged In!",
      });

      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      toast.error(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // GOOGLE LOGIN
  // ============================================

  const loginWithGoogle = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/sso/callback`,
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google login failed";
      toast.error(msg);
      setIsLoading(false);
      throw err;
    }
  };

  // ============================================
  // SIGNUP
  // ============================================

  const signup = async (
    email: string,
    name: string,
    password: string
  ) => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      setSession(null);

      toast.success(
        "Account created! Please check your email to confirm your account."
      );

      router.push("/auth/sign-up-success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      toast.error(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // LOGOUT
  // ============================================

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setTour(undefined);
    setTourLoaded(false);

    toast.success("See You Again!", {
      description: "You Have Been Logged Out!",
    });

    router.push("/auth/login");
  };

  // ============================================
  // LOCAL USER UPDATE
  // ============================================

  const updateUser = (userUpdates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userUpdates });
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        displayName,
        tour,
        tourLoaded,
        session,
        isLoading,
        login,
        signup,
        logout,
        updateUser,
        loginWithGoogle,
        handleCompleteTour,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// ============================================
// CUSTOM HOOK
// ============================================

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context)
    throw new Error("useUser must be used within a UserProvider");
  return context;
};
