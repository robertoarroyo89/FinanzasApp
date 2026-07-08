"use client";

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { userDoc } from "@/services/db";
import { useAuth } from "@/hooks/useAuth";
import type { UserProfile } from "@/types";

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(userDoc(user.uid), (snap) => {
      if (snap.exists()) setProfile(snap.data() as UserProfile);
    });
  }, [user]);

  return profile;
}
