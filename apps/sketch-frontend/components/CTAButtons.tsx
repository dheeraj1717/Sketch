"use client";
import { PencilLine, SquareArrowOutUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import AuthModal from "./AuthModal";
import { useState, useEffect } from "react";

const CTAButtons = () => {
  const [openAuth, setOpenAuth] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleStartCreating = () => {
    setOpenAuth(true);
  };

  const handleShowAuthModal = () => {
    setOpenAuth((prev) => !prev);
  };

  const handleGuestModeClick = () => {
    // Only generate random ID on client side after mounting
    if (isMounted) {
      const roomId = Math.random().toString(36).substring(2, 9);
      router.push(`/canvas/${roomId}`);
    }
  };

  // Don't render until mounted to prevent hydration issues
  // if (!isMounted) {
  //   return (
  //     <div className="flex flex-col sm:flex-row gap-4">
  //       <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 animate-pulse">
  //         <div className="w-24 h-6 bg-purple-400 rounded"></div>
  //       </div>
  //       <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 animate-pulse">
  //         <div className="w-20 h-6 bg-purple-400 rounded"></div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <button
        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
        onClick={handleStartCreating}
      >
        Start Creating
        <PencilLine className="w-4 h-4" />
      </button>
      <button
        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
        onClick={handleGuestModeClick}
      >
        Guest Mode
        <SquareArrowOutUpRight className="w-4 h-4" />
      </button>
      {openAuth && <AuthModal handleShowAuthModal={handleShowAuthModal} />}
    </div>
  );
};

export default CTAButtons;