"use client";
// import { useRouter } from "next/router";
import AuthModal from "./AuthModal";
import { useState } from "react";

const CTAButtons = () => {
  const [openAuth, setOpenAuth] = useState<boolean>(false);
//   const router = useRouter();
  const handleStartCreating = () => {
    setOpenAuth(true);
  };
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <button
        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
        onClick={handleStartCreating}
      >
        Start Creating
        <span className="text-lg">✨</span>
      </button>
      {openAuth && <AuthModal />}
    </div>
  );
};

export default CTAButtons;
