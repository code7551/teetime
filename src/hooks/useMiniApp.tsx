"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import liff from "@line/liff";
import type { AppUser } from "@/types";

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface MiniAppContextType {
  profile: LineProfile | null;
  student: AppUser | null;
  loading: boolean;
  error: string | null;
  isInClient: boolean;
  isLinked: boolean;
  activate: (code: string) => Promise<{ success: boolean; error?: string }>;
  refreshStudent: () => Promise<void>;
}

const MiniAppContext = createContext<MiniAppContextType>({
  profile: null,
  student: null,
  loading: true,
  error: null,
  isInClient: false,
  isLinked: false,
  activate: async () => ({ success: false }),
  refreshStudent: async () => {},
});

export function MiniAppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<LineProfile | null>(null);
  const [student, setStudent] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInClient, setIsInClient] = useState(false);
  const [isLinked, setIsLinked] = useState(false);

  // Fetch student data by LINE userId
  const fetchStudent = useCallback(async (lineUserId: string) => {
    try {
      const res = await fetch(
        `/api/users?lineUserId=${encodeURIComponent(lineUserId)}`
      );
      if (res.ok) {
        const users = await res.json();
        if (users.length > 0) {
          setStudent(users[0]);
          setIsLinked(true);
          return;
        }
      }
      setStudent(null);
      setIsLinked(false);
    } catch {
      setStudent(null);
      setIsLinked(false);
    }
  }, []);

  useEffect(() => {
    const initMiniApp = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          setError("LINE Mini App ID ไม่ได้ถูกตั้งค่า");
          setLoading(false);
          return;
        }

        await liff.init({ liffId });
        setIsInClient(liff.isInClient());

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const lineProfile = await liff.getProfile();
        const p = {
          userId: lineProfile.userId,
          displayName: lineProfile.displayName,
          pictureUrl: lineProfile.pictureUrl,
        };
        setProfile(p);

        // Check if this LINE account is already linked to a student
        await fetchStudent(p.userId);

        // Register service notification token (best-effort, non-blocking)
        try {
          const accessToken = liff.getAccessToken();
          if (accessToken) {
            fetch("/api/service-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ liffAccessToken: accessToken }),
            }).catch(() => {
              // Service messages may not be configured - silently ignore
            });
          }
        } catch {
          // getAccessToken may fail - silently ignore
        }
      } catch (err) {
        console.error("Mini App init error:", err);
        setError("ไม่สามารถเชื่อมต่อ LINE ได้");
      } finally {
        setLoading(false);
      }
    };

    initMiniApp();
  }, [fetchStudent]);

  // Activate with a JWT code
  const activate = async (
    code: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!profile) return { success: false, error: "ไม่พบข้อมูล LINE" };

    try {
      const res = await fetch("/api/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          lineUserId: profile.userId,
          lineDisplayName: profile.displayName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error };
      }

      if (data.student) {
        setStudent(data.student);
        setIsLinked(true);
      }

      return { success: true };
    } catch {
      return { success: false, error: "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง" };
    }
  };

  // Refresh student data
  const refreshStudent = async () => {
    if (profile) {
      await fetchStudent(profile.userId);
    }
  };

  return (
    <MiniAppContext.Provider
      value={{
        profile,
        student,
        loading,
        error,
        isInClient,
        isLinked,
        activate,
        refreshStudent,
      }}
    >
      {children}
    </MiniAppContext.Provider>
  );
}

export function useMiniApp() {
  return useContext(MiniAppContext);
}
