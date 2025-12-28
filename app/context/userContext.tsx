"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface UserContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userUpdates: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // On mount: check if there's an active session
  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    };

    fetchSession();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event: any, newSession: any) => {
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      setUser(data.user);
      setSession(data.session);
      toast.success("Welcome Back!", { description: "You Have Been Logged In!" });
      router.push("/protected");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      toast.error(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function

  // Signup function
  const signup = async (email: string, password: string) => {
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


  // Logout function
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    toast.success("See You Again!", { description: "You Have Been Logged Out!" });
    router.push("/auth/login");
  };

  // Update user context locally
  const updateUser = (userUpdates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userUpdates });
    }
  };

  return (
    <UserContext.Provider value={{ user, session, isLoading, login, signup, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to access UserContext
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};
