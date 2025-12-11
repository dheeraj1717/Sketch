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
  Share2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Header = ({
  handleSelectTool,
  selectedTool,
}: {
  handleSelectTool: (tool: string) => void;
  selectedTool: string;
}) => {
  const { isLoggedIn } = useAuth();
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
    <div className="fixed top-4 left-0 right-0 z-10 flex justify-center pointer-events-none">
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

      {isLoggedIn ? (
          <button 
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer"
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
    </div>
  );
};

export default Header;
