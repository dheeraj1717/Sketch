import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
const wss = new WebSocketServer({ port: 8080 });
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";

type User = {
  userId: string;
  rooms: string[];
  ws: WebSocket;
};
const client = prismaClient;

const users: User[] = [];
function verifyUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return (decoded as JwtPayload).userId;
  } catch (error) {
    return null;
  }
}

wss.on("connection", (ws, request) => {
  const url = request.url;
  if (!url) return;
  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || "";
  const userId = verifyUser(token);
  if (!userId) {
    ws.close();
    return;
  }
  users.push({
    userId,
    rooms: [],
    ws,
  });
  ws.on("message", async (message) => {
    console.log("onnn");
    const parsedData = JSON.parse(message as unknown as string);
    const roomId = parsedData.roomId;
    console.log(parsedData.type);
    // check if the room exists
    const room = await client.room.findFirst({
      where: {
        id: roomId,
      },
    });
    if (!room) {
      return;
    }
    if (parsedData.type === "joinRoom") {
      const user = users.find((user) => user.ws === ws);
      if (!user) {
        return;
      }
      user.rooms.push(roomId);
    }

    if (parsedData.type === "leaveRoom") {
      const user = users.find((user) => user.userId === userId);
      if (!user) {
        return;
      }
      user.rooms = user.rooms.filter((room) => room !== roomId);
    }

    if (parsedData.type === "chat") {
      console.log("chattt");
      const user = users.find((user) => user.userId === userId);
      if (!user) {
        return;
      }
      const shapeData = parsedData.shape;
      console.log(shapeData);

      // Create shape with all required fields according to new schema
      const newShape = await client.shapes.create({
        // Changed from shapes to shape
        data: {
          type: shapeData.type, // Required field
          x: shapeData.x, // Required field (Float)
          y: shapeData.y, // Required field (Float)
          width: shapeData.width || null, // Optional
          height: shapeData.height || null, // Optional
          radius: shapeData.radius || null, // Optional
          fill: shapeData.fill || null, // Optional
          stroke: shapeData.stroke || null, // Optional
          strokeWidth: shapeData.strokeWidth || 1, // Optional with default
          opacity: shapeData.opacity || 1, // Optional with default
          text: shapeData.text || null, // Optional
          fontSize: shapeData.fontSize || null, // Optional
          fontFamily: shapeData.fontFamily || null, // Optional
          points: shapeData.points || null, // Optional JSON field
          roomId: roomId, // Required foreign key
        },
      });

      // Handle points for lines and other complex shapes
      if (shapeData.points) {
        newShape.points = shapeData.points; // This will be stored as JSON
      }

      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(
            JSON.stringify({
              type: "chat",
              shape: newShape, // Send the complete shape object
              roomId,
            })
          );
        }
      });
    }
    if (parsedData.type === "deleteShape") {
      console.log("Deleting shape");
      const user = users.find((user) => user.userId === userId);
      if (!user) {
        return;
      }

      const shapeId = parsedData.shapeId;

      try {
        // Verify the shape exists and belongs to the room
        const existingShape = await client.shapes.findFirst({
          where: {
            id: shapeId,
            roomId: roomId,
          },
        });

        if (!existingShape) {
          console.log("Shape not found or doesn't belong to room:", shapeId);
          return;
        }

        // Delete from database
        await client.shapes.delete({
          where: {
            id: shapeId,
          },
        });

        console.log("Shape deleted successfully:", shapeId);

        // Broadcast deletion to all users in the room
        users.forEach((user) => {
          if (user.rooms.includes(roomId)) {
            user.ws.send(
              JSON.stringify({
                type: "shapeDeleted",
                shapeId: shapeId,
                roomId,
              })
            );
          }
        });
      } catch (error) {
        console.error("Error deleting shape:", error);
        // Send error back to the client
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Failed to delete shape",
            roomId,
          })
        );
      }
    }
  });

  ws.on("close", () => {
    // Clean up user when they disconnect
    const userIndex = users.findIndex((user) => user.ws === ws);
    if (userIndex !== -1) {
      users.splice(userIndex, 1);
    }
  });
});
