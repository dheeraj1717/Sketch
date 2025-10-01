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
} from "lucide-react";

const Header = ({
  handleSelectTool,
  selectedTool,
}: {
  handleSelectTool: (tool: string) => void;
  selectedTool: string;
}) => {
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
      type: "eraser",
      icon: Eraser,
    },
  ];

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white p-4 flex gap-3 rounded-lg shadow-lg">
      {shapes.map((s, i) => {
        const Icon = s.icon;
        return (
          <Icon
            className={`cursor-pointer font-light ${selectedTool === s.type ? "text-purple-600" : "text-black"}`}
            key={i}
            onClick={() => handleSelectTool(s.type)}
          />
        );
      })}
    </div>
  );
};

export default Header;
