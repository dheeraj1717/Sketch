import axios from "axios";
import { API_BASE } from "./urls";

export async function getExistingShapes(roomId: string) {
  try {
    const res = await axios.get(`${API_BASE}/room/canvas/${roomId}`);
    const shapes = res.data.shapes;

    const mappedShapes = shapes.map((shape: any) => {
      if (shape.type === "rectangle" || shape.type === "rect") {
        return {
          type: "rect" as const,
          x: shape.x || 0,
          y: shape.y || 0,
          width: shape.width || 0,
          height: shape.height || 0, // Fixed: was shape.width
        };
      } else if (shape.type === "circle") {
        return {
          type: "circle" as const,
          centerX: shape.x || 0,
          centerY: shape.y || 0,
          radius: shape.radius || 0,
        };
      } else if (shape.type === "text") {
        return {
          type: "text" as const,
          x: shape.x,
          y: shape.y,
          text: shape.text,
          fontSize: shape.fontSize,
          color: "#ffffff",
        };
      } else if (shape.type === "line"){
        return{
          type:"line" as const,
          x:shape.x,
          y:shape.y,
          points:shape.points
        }
      }
      // Default fallback for unknown shape types
      return {
        type: "rect" as const,
        x: shape.x || 0,
        y: shape.y || 0,
        width: shape.width || 0,
        height: shape.height || 0,
      };
    });

    return mappedShapes.filter(Boolean); // Remove any undefined values
  } catch (error) {
    console.log("failed to fetch existing shapes", error);
    return [];
  }
}
