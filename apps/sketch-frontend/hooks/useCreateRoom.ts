"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { API_BASE } from "@/utils/urls";
import { apiClient } from "@/utils/apiClient";

export function useCreateRoom() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { token: authToken } = useAuth();
  const { showToast } = useToast();

  const createRoom = async (explicitToken?: string) => {
    const tokenToUse = explicitToken || authToken;
    
    if (!tokenToUse) {
      showToast("You must be logged in to create a room", "warning");
      return null;
    }

    if (loading) return null;

    setLoading(true);
    try {
      const roomId = Math.random().toString(36).substring(2, 9);
      const res = await apiClient.post(
        `/room/create-room`,
        { name: roomId }
      );

      if (res.data.roomId) {
        showToast("Room created successfully!", "success");
        router.push(`/canvas/${res.data.roomId}`);
        return res.data.roomId;
      }
    } catch (e: any) {
      console.error("Failed to create room", e);
      const errorMessage = e.response?.data?.message || "Failed to create room";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
    return null;
  };

  return { createRoom, loading };
}
