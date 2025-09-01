import { Zap, Users, Maximize } from "lucide-react";
import InforCard from "./_ui/InforCard";
export const featureCards = [
  {
    id: 1,
    icon: Zap,
    title: "Lightning Fast",
    description: "Draw and collaborate in real-time with zero lag",
  },
  {
    id: 2,
    icon: Users,
    title: "Team Collaboration",
    description: "Work together seamlessly with unlimited team members",
  },
  {
    id: 3,
    icon: Maximize,
    title: "Infinite Canvas",
    description: "Limitless space for your biggest and boldest ideas",
  },
];

export default function Home() {
  return (
    <div
      className="h-screen relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('/background.jpg')`,
        backgroundAttachment: "fixed", // Optional: creates parallax effect
      }}
    >
      {/* Background decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-pink-200 rounded-full opacity-60"></div>
        <div className="absolute top-40 right-40 w-24 h-24 bg-purple-200 rounded-full opacity-50"></div>
        <div className="absolute bottom-40 left-40 w-28 h-28 bg-blue-200 rounded-full opacity-40"></div>
        <div className="absolute top-60 left-1/3 w-20 h-20 bg-pink-300 rounded-full opacity-30"></div>
        <div className="absolute bottom-60 right-20 w-36 h-36 bg-blue-300 rounded-full opacity-20"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-purple-300 rounded-full opacity-40"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-pink-200 rounded-full opacity-30"></div>
        <div className="absolute top-80 right-60 w-20 h-20 bg-blue-200 rounded-full opacity-50"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8 text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 mx-auto relative">
            <svg
              className="w-10 h-10 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
            </svg>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-300 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-xs">✨</span>
            </div>
          </div>
        </div>

        {/* Main heading */}
        <h1 className="text-6xl font-bold mb-6 leading-tight">
          <span className="text-gray-800">Create </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
            Together
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-gray-600 max-w-2xl mb-16 leading-relaxed">
          Unleash your creativity with our collaborative drawing platform.
          Sketch, design, and bring ideas to life with friends and teammates.
        </p>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl">
          {featureCards.map((card) => (
            <InforCard
              key={card.id}
              Logo={card.icon}
              title={card.title}
              description={card.description}
            />
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 cursor-pointer">
            Start Creating
            <span className="text-lg">✨</span>
          </button>
        </div>
      </div>
    </div>
  );
}
