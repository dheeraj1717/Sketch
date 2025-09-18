import axios from "axios";
import { API_BASE } from "./urls";

export async function getExistingShapes(roomId: string) {
  try {
    const res = await axios.get(`${API_BASE}/room/canvas/${roomId}`);
    const shapes = res.data.shapes;

    const mappedShapes = shapes.map((shape: any) => {
      if (shape.type === "rectangle" || shape.type === "rect") {
        return {
          type: "rect",
          x: shape.x,
          y: shape.y,
          widht: shape.width || 0,
          height: shape.width || 0,
        };
      }
    });
    return mappedShapes;
  } catch (error) {
    console.log("failed to fetch existing shapes", error);
    return [];
  }
}
