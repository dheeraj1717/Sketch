import { Circle, Hand, Icon, Pencil, RectangleEllipsis, Square } from "lucide-react";

const Header = ({
  handleSetTool,
  selectedTool,
}: {
  handleSetTool: (tool: string) => void;
  selectedTool: string;
}) => {
  const shapes = [
    {
      type: "rect",
      icon: Square,
    },
     {
      type: "circle",
      icon: Circle,
    },
     {
      type: "hand",
      icon: Hand,
    },
     {
      type: "line",
      icon: Pencil,
    },
  ];

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-10 text-black bg-white p-4 flex gap-3 rounded-lg shadow-lg">
      {shapes.map((s, i) => {
        const Icon = s.icon;
        return <Icon className="cursor-pointer font-light" key={i} onClick={() => handleSetTool(s.type)}/>;
      })}
    </div>
  );
};

export default Header;
