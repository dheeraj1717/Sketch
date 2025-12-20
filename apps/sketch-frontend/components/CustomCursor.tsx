"use client";
import { useEffect, useState } from "react";
import { PenTool } from "lucide-react";

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  const [isOverCanvas, setIsOverCanvas] = useState(false);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const updateStatus = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Update hovering status for buttons/links
      if (
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest("button") ||
        target.closest("a") ||
        target.classList.contains("cursor-pointer")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }

      // Update canvas status
      if (target.tagName === "CANVAS" || target.closest("canvas")) {
        setIsOverCanvas(true);
      } else {
        setIsOverCanvas(false);
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener("mousemove", updatePosition);
    window.addEventListener("mouseover", updateStatus);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", updatePosition);
      window.removeEventListener("mouseover", updateStatus);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  if (typeof window === "undefined") return null;

  return (
    <>
      <style jsx global>{`
        body {
          cursor: ${isOverCanvas ? "default" : "none"};
        }
        a,
        button,
        .cursor-pointer {
          cursor: ${isOverCanvas ? "pointer" : "none"} !important;
        }
        canvas {
          cursor: crosshair !important;
        }
      `}</style>
      <div
        className={`fixed top-0 left-0 pointer-events-none z-[99999] transition-opacity duration-200 ${
          isOverCanvas ? "opacity-0" : "opacity-100"
        }`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
      >
        <div
          className={`relative transition-transform duration-100 ease-out ${
            isClicking ? "scale-90 rotate-12" : "rotate-0"
          }`}
        >
          {/* Pencil Icon */}
          <div
            className={`text-purple-600 transition-all duration-300 ${isHovering ? "scale-125 -rotate-12" : "scale-100"}`}
          >
            <PenTool className="w-6 h-6 fill-purple-100" />
          </div>
        </div>
      </div>

      {/* Trailing Dot */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-[99998] w-2 h-2 bg-purple-400 rounded-full opacity-50 transition-all duration-300 ease-out"
        style={{
          transform: `translate(${position.x + 4}px, ${position.y + 20}px)`,
          opacity: (isHovering || isOverCanvas) ? 0 : 0.5,
        }}
      />
    </>
  );
}
