"use client";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { X, User, Mail, Lock } from "lucide-react";
import { API_BASE } from "@/utils/urls";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

interface AuthDTO {
  name?: string;
  email: string;
  password: string;
}

const AuthModal = ({ 
  handleShowAuthModal,
  onAuthSuccess 
}: { 
  handleShowAuthModal: () => void;
  onAuthSuccess?: () => void;
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("signup");
  const { login } = useAuth();
  const [errorString, setErrorString] = useState("");

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<AuthDTO>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  // Reset form when switching tabs
  useEffect(() => {
    reset();
    setErrorString("");
  }, [activeTab, reset]);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="fixed inset-0 bg-purple-100/20 z-10 flex items-center justify-center">
        <div className="bg-white p-10 rounded-2xl shadow-xl animate-pulse">
          <div className="w-80 h-96 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  const handleTabSwitch = (tab: "login" | "signup") => {
    setActiveTab(tab);
  };

  const onSubmit = async (data: AuthDTO) => {
    try {
      setErrorString("");
      const endpoint = activeTab === "signup" ? "/auth/signup" : "/auth/signin";
      const payload = activeTab === "signup"
        ? {
            name: data.name,
            username: data.email.split("@")[0], // Simple username generation
            email: data.email,
            password: data.password,
          }
        : {
            email: data.email,
            password: data.password,
          };

      const res = await axios.post(`${API_BASE}${endpoint}`, payload);

      if (res.status === 201 || res.status === 200) {
        const accessToken = res.data.accessToken;
        let user: any = res.data.user;
        
        if (!user && activeTab === "login") {
           user = {
              email: data.email,
              name: "User",
              id: "unknown"
           }
        }

        login(accessToken, user);
        handleShowAuthModal();
        if (onAuthSuccess) {
          onAuthSuccess();
        }
      }
    } catch (e: any) {
      console.error(e);
      if (e.response && e.response.data && e.response.data.message) {
        setErrorString(e.response.data.message);
      } else {
        setErrorString("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal */}
      <div className="bg-white text-black p-8 rounded-2xl shadow-2xl w-full max-w-md relative transform transition-all duration-300 scale-100">
        <X
          className="absolute top-6 right-6 cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
          size={24}
          onClick={() => handleShowAuthModal()}
        />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-200 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-700 bg-clip-text text-transparent">
            Welcome
          </h1>
          <p className="text-gray-500 mt-2">
            {activeTab === "signup"
              ? "Create your account to get started"
              : "Sign in to your account"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-50 rounded-xl p-1 mb-6">
          <button
            onClick={() => handleTabSwitch("signup")}
            className={`flex-1 py-3 px-6 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === "signup"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => handleTabSwitch("login")}
            className={`flex-1 py-3 px-6 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === "login"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Login
          </button>
        </div>

        {errorString && (
            <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg mb-4 text-center">
              {errorString}
            </div>
          )}

        <div className="space-y-4">
          {/* Name field - only show for signup */}
          {activeTab === "signup" && (
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 text-left"
              >
                Full Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  {...register("name", {
                    setValueAs: (value) => value?.trim() || "",
                    required:
                      activeTab === "signup" ? "Name is required" : false,
                  })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  {errors.name.message}
                </p>
              )}
            </div>
          )}

          {/* Email field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 text-left"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email address",
                  },
                })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 text-left"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            className="w-full bg-gradient-to-r from-purple-400 to-purple-700 text-white py-3 px-6 rounded-xl font-medium  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 shadow-lg cursor-pointer"
          >
            {activeTab === "signup" ? "Create Account" : "Sign In"}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            {activeTab === "signup"
              ? "Already have an account? "
              : "Don't have an account? "}
            <button
              onClick={() =>
                handleTabSwitch(activeTab === "signup" ? "login" : "signup")
              }
              className="text-purple-600 hover:text-purple-700 font-medium transition-colors cursor-pointer"
            >
              {activeTab === "signup" ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
