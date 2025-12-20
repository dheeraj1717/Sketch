import { apiClient } from "@/utils/apiClient";

type Shapes =
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "circle";
      centerX: number;
      centerY: number;
      radius: number;
    };

export async function initDraw(
  canvas: HTMLCanvasElement,
  roomId: string,
  socket: WebSocket,
  transformRef: React.MutableRefObject<{ x: number; y: number; scale: number }>,
  redrawFunctionRef: React.MutableRefObject<(() => void) | null>
): Promise<(() => void) | null> {
  const ctx = canvas.getContext("2d");
  console.log("------------");
  
  if (!ctx) return null;

  const shapes = await getExistingShapes(roomId);
  let existingShapes: Shapes[] = shapes;

  // Coordinate conversion functions
  function screenToWorld(screenX: number, screenY: number) {
    const transform = transformRef.current;
    return {
      x: (screenX - transform.x) / transform.scale,
      y: (screenY - transform.y) / transform.scale
    };
  }

  function worldToScreen(worldX: number, worldY: number) {
    const transform = transformRef.current;
    return {
      x: worldX * transform.scale + transform.x,
      y: worldY * transform.scale + transform.y
    };
  }

  function getCanvasCoordinates(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const screenCoords = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    // Convert to world coordinates
    return screenToWorld(screenCoords.x, screenCoords.y);
  }

  // Socket message handling
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log("xxxxxxxxxxxx", message);
    if (message.type === "chat") {
      const parsedShapes = message.shape;
      existingShapes.push(parsedShapes);
      redrawCanvas();
    }
  };

  // Drawing state
  let clicked = false;
  let startX = 0;
  let startY = 0;
  let currentTool = "rect"; // Could be extended for different tools

  // Redraw function that applies transformations
  function redrawCanvas() {
    if (!ctx) return;
    
    // Clear the entire canvas
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fill background
    ctx.fillStyle = "rgba(30, 30, 30, 1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply transformations
    ctx.translate(transformRef.current.x, transformRef.current.y);
    ctx.scale(transformRef.current.scale, transformRef.current.scale);
    
    // Draw grid for infinite canvas feel
    drawGrid(ctx, transformRef);
    
    // Draw all existing shapes
    existingShapes.forEach((shape) => {
      drawShape(ctx, shape);
    });
    
    ctx.restore();
  }

  function drawGrid(ctx: CanvasRenderingContext2D, transform: any) {
    const gridSize = 50;
    ctx.save();
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.lineWidth = 1 / transform.scale;
    
    const startX = Math.floor(-transform.x / transform.scale / gridSize) * gridSize;
    const startY = Math.floor(-transform.y / transform.scale / gridSize) * gridSize;
    const endX = startX + (canvas.width / transform.scale) + gridSize;
    const endY = startY + (canvas.height / transform.scale) + gridSize;
    
    // Draw vertical lines
    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
    
    ctx.restore();
  }

  function drawShape(ctx: CanvasRenderingContext2D, shape: Shapes) {
    ctx.save();
    
    const transform = transformRef.current;
    
    if (shape.type === "rect") {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 2 / transform.scale; // Keep line width consistent
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    } else if (shape.type === "circle") {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 2 / transform.scale;
      ctx.beginPath();
      ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
    
    ctx.restore();
  }

  // Mouse event handlers
  function handleMouseDown(e: MouseEvent) {
    // Only handle left mouse button and not when panning
    if (e.button !== 0 || e.shiftKey) return;
    
    clicked = true;
    const coords = getCanvasCoordinates(e);
    startX = coords.x;
    startY = coords.y;
  }

  function handleMouseUp(e: MouseEvent) {
    if (!clicked || e.button !== 0) return;
    clicked = false;

    const coords = getCanvasCoordinates(e);
    const width = coords.x - startX;
    const height = coords.y - startY;

    const transform = transformRef.current;

    // Only create shape if it has meaningful size
    if (Math.abs(width) > 5 / transform.scale || Math.abs(height) > 5 / transform.scale) {
      let newShape: Shapes;
      
      if (currentTool === "rect") {
        newShape = {
          type: "rect" as const,
          x: Math.min(startX, coords.x),
          y: Math.min(startY, coords.y),
          width: Math.abs(width),
          height: Math.abs(height),
        };
      } else {
        // Circle tool (could be added later)
        const radius = Math.sqrt(width * width + height * height) / 2;
        newShape = {
          type: "circle" as const,
          centerX: startX + width / 2,
          centerY: startY + height / 2,
          radius: radius,
        };
      }
      
      existingShapes.push(newShape);
      
      // Send only the new shape
      socket.send(JSON.stringify({ 
        type: "chat", 
        shape: newShape, 
        roomId 
      }));
    }
    
    redrawCanvas();
  }

  function handleMouseMove(e: MouseEvent) {
    if (!clicked || !ctx) return;
    
    const coords = getCanvasCoordinates(e);
    const width = coords.x - startX;
    const height = coords.y - startY;

    const transform = transformRef.current;

    // Clear and redraw everything
    redrawCanvas();
    
    // Draw current shape being created
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);
    
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2 / transform.scale;
    
    if (currentTool === "rect") {
      ctx.strokeRect(
        Math.min(startX, coords.x),
        Math.min(startY, coords.y),
        Math.abs(width),
        Math.abs(height)
      );
    } else if (currentTool === "circle") {
      const radius = Math.sqrt(width * width + height * height) / 2;
      ctx.beginPath();
      ctx.arc(startX + width / 2, startY + height / 2, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
    
    ctx.restore();
  }

  // Add event listeners
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mousemove", handleMouseMove);
  
  // Prevent right-click context menu
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  // Initial draw
  redrawCanvas();

  // Set the redraw function reference so it can be called from outside
  redrawFunctionRef.current = redrawCanvas;

  // Return cleanup function
  return () => {
    canvas.removeEventListener("mousedown", handleMouseDown);
    canvas.removeEventListener("mouseup", handleMouseUp);
    canvas.removeEventListener("mousemove", handleMouseMove);
    canvas.removeEventListener("contextmenu", (e) => e.preventDefault());
  };
}

async function getExistingShapes(roomId: string) {
  try {
    const res = await apiClient.get(`/room/canvas/${roomId}`);
    const shapes = res.data.shapes;
    console.log("shapesrendered", shapes);

    const mappedShapes = shapes.map((shape: any) => {
      if (shape.type === "rectangle" || shape.type === "rect") {
        return {
          type: "rect" as const,
          x: shape.x,
          y: shape.y,
          width: shape.width || 0,
          height: shape.height || 0,
        };
      } else if (shape.type === "circle") {
        return {
          type: "circle" as const,
          centerX: shape.x, // Assuming x is already centerX in your DB
          centerY: shape.y, // Assuming y is already centerY in your DB
          radius: shape.radius || 0,
        };
      }
      // Default fallback - treat unknown types as rectangles
      return {
        type: "rect" as const,
        x: shape.x,
        y: shape.y,
        width: shape.width || 0,
        height: shape.height || 0,
      };
    });

    return mappedShapes;
  } catch (error) {
    console.error("Failed to load existing shapes:", error);
    return [];
  }
}