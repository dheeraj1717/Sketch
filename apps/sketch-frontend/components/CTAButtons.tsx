"use client";
import { PencilLine, SquareArrowOutUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import AuthModal from "./AuthModal";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

import { API_BASE } from "@/utils/urls";
import axios from "axios";

const CTAButtons = () => {
  const [openAuth, setOpenAuth] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { isLoggedIn, token } = useAuth();

  const createRoomAndNavigate = async () => {
    if (loading) return;
    setLoading(true);
    try {
        const roomId = Math.random().toString(36).substring(2, 9); // Fallback slug/name
        const res = await axios.post(`${API_BASE}/room/create-room`, {
            name: roomId
        }, {
            headers: { Authorization: token }
        });
        
        if (res.data.roomId) {
            router.push(`/canvas/${res.data.roomId}`);
        }
    } catch (e) {
        console.error("Failed to create room", e);
        alert("Failed to create room");
    } finally {
        setLoading(false);
    }
  };

  const handleStartCreating = () => {
    if (isLoggedIn) {
      createRoomAndNavigate();
    } else {
      setOpenAuth(true);
    }
  };

  const handleShowAuthModal = () => {
    setOpenAuth((prev) => !prev);
  };

  const handleGuestModeClick = () => {
    // Only generate random ID on client side after mounting
    if (isMounted) {
      const roomId = Math.random().toString(36).substring(2, 9);
      router.push(`/canvas/${roomId}?mode=guest`);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <button
        className={`bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 cursor-pointer ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        onClick={handleStartCreating}
        disabled={loading}
      >
        {loading ? "Creating..." : "Start Creating"}
        <PencilLine className="w-4 h-4" />
      </button>
      <button
        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
        onClick={handleGuestModeClick}
      >
        Guest Mode
        <SquareArrowOutUpRight className="w-4 h-4" />
      </button>
      {openAuth && (
        <AuthModal 
          handleShowAuthModal={handleShowAuthModal} 
          onAuthSuccess={createRoomAndNavigate}
        />
      )}
    </div>
  );
};

export default CTAButtons;