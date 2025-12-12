import {
  Circle,
  Eraser,
  Hand,
  Icon,
  MousePointer2,
  Pencil,
  Pointer,
  RectangleEllipsis,
  Slash,
  Square,
  Type,
  Share2,
  Home,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

const Header = ({
  handleSelectTool,
  selectedTool,
}: {
  handleSelectTool: (tool: string) => void;
  selectedTool: string;
}) => {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuestMode = searchParams.get("mode") === "guest";
  const shapes = [
    {
      type: "move",
      icon: MousePointer2,
    },
    {
      type: "rect",
      icon: Square,
    },
    {
      type: "circle",
      icon: Circle,
    },
    {
      type: "line",
      icon: Slash,
    },
    {
      type: "text",
      icon: Type,
    },
    {
      type: "eraser",
      icon: Eraser,
    },
    {
      type: "pencil",
      icon: Pencil,
    },
  ];

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-between px-4 pointer-events-none">
      {/* Back to Home Button */}
      <button
        onClick={() => router.push("/")}
        className="bg-white hover:bg-gray-50 p-3 flex items-center gap-2 rounded-lg shadow-lg pointer-events-auto transition-all hover:shadow-xl group cursor-pointer"
      >
        <Home className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
        <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">
          Home
        </span>
      </button>

      {/* Toolbar - Pointer events auto to allow interaction */}
      <div className="bg-white p-3 flex gap-3 rounded-lg shadow-lg pointer-events-auto items-center">
        {shapes.map((s, i) => {
          const Icon = s.icon;
          return (
            <Icon
              className={`cursor-pointer w-5 h-5 transition-colors ${selectedTool === s.type ? "text-purple-600" : "text-gray-500 hover:text-black"}`}
              key={i}
              onClick={() => handleSelectTool(s.type)}
            />
          );
        })}

        {/* Separator */}
        <div className="w-px h-6 bg-gray-200 mx-2"></div>

        {!isGuestMode && isLoggedIn ? (
          <button
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer shadow-md hover:shadow-lg"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Link copied to clipboard!");
            }}
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        ) : null}
      </div>

      {/* Empty div for spacing balance */}
      <div className="w-[100px]"></div>
    </div>
  );
};

export default Header;
