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
                  <button className="flex items-center gap-3 py-2 px-4 text-sm font-medium text-gray-700 hover:text-black transition-all rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 border border-transparent hover:border-purple-200">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="font-semibold">{user?.name}</span>
                    <svg
                      className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-transform group-hover:rotate-180 duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown User Menu */}
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 hidden group-hover:block hover:block transform opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 origin-top-right z-50">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-600 truncate mt-0.5">
                        {user?.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/history"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors group/item"
                      >
                        <Folder className="w-4 h-4 group-hover/item:scale-110 transition-transform" />
                        <span className="font-medium">My Rooms</span>
                      </Link>
                      <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors group/item cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 group-hover/item:scale-110 transition-transform" />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-purple-500/20 cursor-pointer"
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
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
            <div className="px-4 pt-2 pb-4 space-y-2">
              {isLoggedIn ? (
                <>
                  <div className="px-3 py-3 text-base font-semibold text-gray-800 border-b border-gray-100 mb-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
                        {user?.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="font-semibold">{user?.name}</div>
                        <span className="text-xs text-gray-600 block font-normal">
                          {user?.email}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/history"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Folder className="w-5 h-5" />
                    My Rooms
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsAuthModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-purple-600 hover:bg-purple-50 cursor-pointer"
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
