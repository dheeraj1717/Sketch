"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User, Folder, Menu, X } from "lucide-react";
import AuthModal from "./AuthModal";

export function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  S
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                  Sketch
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              {isLoggedIn ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 py-2 px-3 text-sm font-medium text-gray-700 hover:text-black transition-colors rounded-md hover:bg-gray-100">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                        {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span>{user?.name}</span>
                  </button>
                  
                  {/* Dropdown User Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 hidden group-hover:block hover:block transform opacity-0 group-hover:opacity-100 transition-all duration-200 origin-top-right z-50">
                     <div className="px-4 py-2 border-b border-gray-100">
                         <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                         <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                     </div>
                     <Link href="/history" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                        <Folder className="w-4 h-4" />
                        My Rooms
                     </Link>
                     <button
                        onClick={logout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-purple-500/20"
                >
                  Login
                </button>
              )}
            </div>

             {/* Mobile Menu Button */}
             <div className="flex md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-black focus:outline-none"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200">
             <div className="px-4 pt-2 pb-4 space-y-1">
                 {isLoggedIn ? (
                     <>
                        <div className="px-3 py-2 text-base font-medium text-gray-800 border-b border-gray-100 mb-2">
                            {user?.name} <span className="text-xs text-gray-500 block font-normal">{user?.email}</span>
                        </div>
                        <Link href="/history" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                            My Rooms
                        </Link>
                         <button
                            onClick={logout}
                            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                        >
                            Logout
                        </button>
                     </>
                 ) : (
                    <button
                        onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-purple-600 hover:bg-purple-50"
                      >
                        Login
                      </button>
                 )}
             </div>
          </div>
        )}
      </nav>

      {isAuthModalOpen && (
        <AuthModal handleShowAuthModal={() => setIsAuthModalOpen(false)} />
      )}
    </>
  );
}
