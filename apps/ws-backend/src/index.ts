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
    const parsedData = JSON.parse(message as unknown as string);
    const roomId = parsedData.roomId;
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
      const user = users.find((user) => user.userId === userId);
      if (!user) {
        return;
      }
      const message = parsedData.message;

      await client.chat.create({
        data: {
          message,
          roomId,
          userId,
        },
      })
      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(
            JSON.stringify({
              type: "chat",
              message,
              roomId,
            })
          );
        }
      });
    }
  });
});
