import { API_BASE } from "@/utils/urls";
import axios from "axios";

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
export async function intiDraw(canvas: HTMLCanvasElement, roomId: string) {
  const ctx = canvas.getContext("2d");
  const shapes = await getExistingShapes(roomId);
  let existingShapes: Shapes[] = shapes;
  if (!ctx) return;

  ctx.fillStyle = "rgba(0,0,0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  clearCanvas(existingShapes, canvas, ctx);
  let clicked = false;
  let startX = 0;
  let startY = 0;
  function getCanvasCoordinates(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  canvas.addEventListener("mousedown", (e) => {
    clicked = true;
    const coords = getCanvasCoordinates(e);
    startX = coords.x;
    startY = coords.y;
  });

  canvas.addEventListener("mouseup", (e) => {
    if (!clicked) return;
    clicked = false;

    const coords = getCanvasCoordinates(e);
    const width = coords.x - startX;
    const height = coords.y - startY;

    // Only add shape if it has some size
    if (Math.abs(width) > 1 || Math.abs(height) > 1) {
      existingShapes.push({
        type: "rect",
        x: startX,
        y: startY,
        width,
        height,
      });
    }
  });
  canvas.addEventListener("mousemove", (e) => {
    if (clicked) {
      const coords = getCanvasCoordinates(e);
      const width = coords.x - startX;
      const height = coords.y - startY;

      // Clear and redraw everything
      clearCanvas(existingShapes, canvas, ctx);

      // Draw current shape being created
      ctx.strokeStyle = "rgba(255,255,255,1)";
      ctx.strokeRect(startX, startY, width, height);
    }
  });
  // Prevent right-click context menu
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
}

function clearCanvas(
  existingShapes: Shapes[],
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  existingShapes.map((shape) => {
    if (shape.type === "rect") {
      ctx.strokeStyle = "rgba(255,255,255)";
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }
    // else if (shape.type === "circle") {
    //   ctx.beginPath();
    //   ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, 2 * Math.PI);
    //   ctx.fill();
    // }
  });
}

async function getExistingShapes(roomId: string) {
  const res = await axios.get(`${API_BASE}/room/canvas/${roomId}`);
  const shapes = res.data.shapes;

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
}
