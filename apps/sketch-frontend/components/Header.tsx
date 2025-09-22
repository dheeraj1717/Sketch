const Header = ({ 
  handleSetTool, 
  selectedTool 
}: { 
  handleSetTool: (tool: string) => void;
  selectedTool: string;
}) => {
  const shapes = ["rect", "circle", "line", "text"];
  
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-10 text-black bg-white p-4 flex gap-2 rounded-lg shadow-lg">
      {shapes.map((s, i) => (
        <span 
          key={i}
          className={`cursor-pointer px-3 py-1 rounded transition-colors ${
            selectedTool === s 
              ? 'bg-blue-500 text-white' 
              : 'hover:bg-gray-200'
          }`}
          onClick={() => handleSetTool(s)}
        >
          {s}
        </span>
      ))}
    </div>
  );
};

export default Header;