import { Draw } from "@/draw/draw";
import { useEffect, useRef, useState } from "react";
import { CanvasControls } from "./CanvasControls";

export default function Canvas({
  roomId,
  socket,
  selectedTool = "rect",
}: {
  roomId: string;
  socket: WebSocket | null;
  selectedTool?: string;
}) {
  const [drawInstance, setDrawInstance] = useState<Draw | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    scale: 1,
  });
  const transformRef = useRef(transform);

  // Update transform ref whenever transform changes
  useEffect(() => {
    transformRef.current = transform;
    // Trigger redraw when transform changes
    if (drawInstance) {
      drawInstance.onTransformChange();
    }
  }, [transform, drawInstance]);

  // Initialize Draw class
  useEffect(() => {
    if (canvasRef.current) {
      const drawClassInstance = new Draw(
        canvasRef.current,
        roomId,
        socket,
        transformRef
      );
      setDrawInstance(drawClassInstance);

      return () => {
        drawClassInstance.destroy();
      };
    }
  }, [roomId, socket]);

  // Update tool when selectedTool changes
  useEffect(() => {
    if (drawInstance) {
      drawInstance.setTool(selectedTool);
    }
  }, [selectedTool, drawInstance]);

  // Handle canvas resizing
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        // Redraw after resize
        if (drawInstance) {
          drawInstance.onTransformChange();
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [drawInstance]);

  // Handle infinite canvas interactions (pan and zoom)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      // Middle mouse button for panning
      if (e.button === 1) {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.style.cursor = "grabbing";
        e.preventDefault();
      }
      // Shift + Left mouse for panning
      else if (e.button === 0 && e.shiftKey) {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.style.cursor = "grabbing";
        e.preventDefault();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;

        setTransform((prev) => ({
          ...prev,
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));

        lastX = e.clientX;
        lastY = e.clientY;
        e.preventDefault();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        isDragging = false;
        canvas.style.cursor = "default";
        e.preventDefault();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Check if Ctrl key is pressed for zoom, otherwise pan
      if (e.ctrlKey || e.metaKey) {
        // Zoom behavior (Ctrl + scroll)
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;

        setTransform((prev) => {
          const newScale = Math.max(0.1, Math.min(5, prev.scale * scaleFactor));

          // Zoom towards mouse position
          const scaleChange = newScale / prev.scale;
          return {
            scale: newScale,
            x: mouseX - (mouseX - prev.x) * scaleChange,
            y: mouseY - (mouseY - prev.y) * scaleChange,
          };
        });
      } else {
        // Pan behavior (regular scroll)
        const panSpeed = 1;
        const deltaX = e.deltaX * panSpeed;
        const deltaY = e.deltaY * panSpeed;

        setTransform((prev) => ({
          ...prev,
          x: prev.x - deltaX,
          y: prev.y - deltaY,
        }));
      }
    };

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        canvas.style.cursor = "grab";
        e.preventDefault();
      }

      // Reset view with 'R' key
      if (e.code === "KeyR") {
        setTransform({
          x: 0,
          y: 0,
          scale: 1,
        });
      }

      // Fit to center with 'F' key
      if (e.code === "KeyF") {
        setTransform({
          x: canvas.width / 2,
          y: canvas.height / 2,
          scale: 1,
        });
      }

      // Arrow keys for panning
      const panStep = 50;
      if (e.code === "ArrowUp") {
        setTransform((prev) => ({ ...prev, y: prev.y + panStep }));
        e.preventDefault();
      }
      if (e.code === "ArrowDown") {
        setTransform((prev) => ({ ...prev, y: prev.y - panStep }));
        e.preventDefault();
      }
      if (e.code === "ArrowLeft") {
        setTransform((prev) => ({ ...prev, x: prev.x + panStep }));
        e.preventDefault();
      }
      if (e.code === "ArrowRight") {
        setTransform((prev) => ({ ...prev, x: prev.x - panStep }));
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        canvas.style.cursor = "default";
      }
    };

    // Touch support for mobile
    let touchStartDistance = 0;
    let touchStartTransform = { x: 0, y: 0, scale: 1 };
    let touchStartCenter = { x: 0, y: 0 };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 2) {
        // Pinch to zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        touchStartDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        touchStartTransform = { ...transform };
        touchStartCenter = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };
      } else if (e.touches.length === 1) {
        // Pan
        isDragging = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 2) {
        // Pinch to zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        if (touchStartDistance > 0) {
          const scaleFactor = currentDistance / touchStartDistance;
          const newScale = Math.max(
            0.1,
            Math.min(5, touchStartTransform.scale * scaleFactor)
          );

          const currentCenter = {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2,
          };

          setTransform({
            scale: newScale,
            x: touchStartTransform.x + (currentCenter.x - touchStartCenter.x),
            y: touchStartTransform.y + (currentCenter.y - touchStartCenter.y),
          });
        }
      } else if (e.touches.length === 1 && isDragging) {
        // Pan
        const deltaX = e.touches[0].clientX - lastX;
        const deltaY = e.touches[0].clientY - lastY;

        setTransform((prev) => ({
          ...prev,
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));

        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      isDragging = false;
      touchStartDistance = 0;
    };

    // Add event listeners
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);

      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [transform]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="cursor-crosshair touch-none"
        style={{
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgb(30, 30, 30)",
        }}
      />

      {/* UI Controls */}
      <CanvasControls transform={transform} selectedTool={selectedTool} />
    </div>
  );
}
