import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
const port = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: Number(port) });
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

const roomAdmins: Map<string, string> = new Map(); // roomId -> adminUserId
const blockedUsers: Map<string, Set<string>> = new Map(); // roomId -> Set<blockedUserIds>

wss.on("connection", (ws, request) => {
  // ... (previous connection logic)
  const url = request.url;
  if (!url) return;
  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || "";
  let userId = verifyUser(token);
  if (!userId) {
     // Guest logic - actually we enforce no connection for guests on frontend, but safe to fallback here
     // If guests DO connect, they are read-only effectively if we don't save their shapes
     userId = `guest-${Math.random().toString(36).substring(7)}`;
  }
  
  users.push({
    userId,
    rooms: [],
    ws,
  });

  ws.on("message", async (message) => {
    let parsedData;
    try {
        parsedData = JSON.parse(message as unknown as string);
    } catch(e) {
        return;
    }

    const roomId = parsedData.roomId;
    
    // check if the room exists
    // Optimized: Only check DB if we don't know the admin yet (first join)
    if (!roomAdmins.has(roomId)) {
        const room = await client.room.findFirst({
            where: { id: roomId },
        });
        if (!room) return;
        roomAdmins.set(roomId, room.adminId);
    }

    // Helper to broadcast users list
    const broadcastUsersList = () => {
        const roomUsers = users
            .filter(u => u.rooms.includes(roomId))
            .map(u => ({ userId: u.userId })); // In real app, fetch names
        
        users.forEach(u => {
            if (u.rooms.includes(roomId)) {
                u.ws.send(JSON.stringify({
                    type: "usersList",
                    users: roomUsers,
                    roomId
                }));
            }
        });
    };

    if (parsedData.type === "joinRoom") {
      const user = users.find((user) => user.ws === ws);
      if (!user) return;
      user.rooms.push(roomId);
      broadcastUsersList();
      
      // Send admin info to joining user
      const adminId = roomAdmins.get(roomId);
      ws.send(JSON.stringify({
          type: "roomState",
          adminId: adminId,
          amIAdmin: adminId === userId,
          roomId
      }));
    }

    if (parsedData.type === "leaveRoom") {
      const user = users.find((user) => user.userId === userId);
      if (!user) return;
      user.rooms = user.rooms.filter((room) => room !== roomId);
      broadcastUsersList();
    }

    // Admin Actions
    const adminId = roomAdmins.get(roomId);
    const isAdmin = adminId === userId;

    if (parsedData.type === "blockUser" && isAdmin) {
        const targetUserId = parsedData.userId;
        if (!blockedUsers.has(roomId)) {
            blockedUsers.set(roomId, new Set());
        }
        blockedUsers.get(roomId)?.add(targetUserId);
        
        // Notify target? Or broadcast block list?
        // Let's just block silently for now or broadcast new state
    }
    
    if (parsedData.type === "unblockUser" && isAdmin) {
        const targetUserId = parsedData.userId;
         blockedUsers.get(roomId)?.delete(targetUserId);
    }
    
    if (parsedData.type === "kickUser" && isAdmin) {
         const targetUserId = parsedData.userId;
         const targetUser = users.find(u => u.userId === targetUserId);
         if (targetUser) {
             targetUser.ws.send(JSON.stringify({ type: "kicked", roomId }));
             targetUser.rooms = targetUser.rooms.filter(r => r !== roomId);
             // Optionally close connection or just remove from room
         }
         broadcastUsersList();
    }


    if (parsedData.type === "chat") {
      const user = users.find((user) => user.userId === userId);
      if (!user) return;
      
      // CHECK IF BLOCKED
      if (blockedUsers.get(roomId)?.has(userId)) {
          return; // Silently ignore drawing
      }

      const shapeData = parsedData.shape;

      try {
        const newShape = await client.shapes.create({
            data: {
            type: shapeData.type,
            x: shapeData.x,
            y: shapeData.y,
            width: shapeData.width || null,
            height: shapeData.height || null,
            radius: shapeData.radius || null,
            fill: shapeData.fill || null,
            stroke: shapeData.stroke || null,
            strokeWidth: shapeData.strokeWidth || 1,
            opacity: shapeData.opacity || 1,
            text: shapeData.text || null,
            fontSize: shapeData.fontSize || null,
            fontFamily: shapeData.fontFamily || null,
            points: shapeData.points || null,
            roomId: roomId,
            },
        });

        if (shapeData.points) {
            newShape.points = shapeData.points;
        }

        users.forEach((user) => {
            if (user.rooms.includes(roomId)) {
            user.ws.send(
                JSON.stringify({
                type: "chat",
                shape: newShape,
                roomId,
                })
            );
            }
        });
      } catch (error) {
        console.error("Error creating shape:", error);
      }
    }

    if (parsedData.type === "shapeUpdate") {
        const user = users.find((user) => user.userId === userId);
        if (!user) return;
        
        if (blockedUsers.get(roomId)?.has(userId)) return;

        const shapeData = parsedData.shape;
        
        try {
            await client.shapes.update({
                where: { id: shapeData.id },
                data: {
                    x: shapeData.x,
                    y: shapeData.y,
                    width: shapeData.width,
                    height: shapeData.height,
                    radius: shapeData.radius,
                    points: shapeData.points,
                    text: shapeData.text
                }
            });

            users.forEach((user) => {
                if (user.rooms.includes(roomId) && user.userId !== userId) {
                        user.ws.send(JSON.stringify({
                            type: "shapeUpdate",
                            shape: shapeData,
                            roomId
                        }));
                }
            });
        } catch(error) {
            console.error("Error updating shape:", error);
        }
    }

    if (parsedData.type === "cursor") {
        // We can allow cursors even if blocked? Or block them too?
        // Let's block cursors too if blocked.
        if (blockedUsers.get(roomId)?.has(userId)) return;
        
        users.forEach((user) => {
            if (user.rooms.includes(roomId) && user.userId !== userId) {
                user.ws.send(JSON.stringify({
                    type: "cursor",
                    userId: userId,
                    x: parsedData.x,
                    y: parsedData.y,
                    roomId
                }));
            }
        });
    }

    if (parsedData.type === "deleteShape") {
      const user = users.find((user) => user.userId === userId);
      if (!user) return;

      if (blockedUsers.get(roomId)?.has(userId)) return;

      const shapeId = parsedData.shapeId;

      try {
        const existingShape = await client.shapes.findFirst({
          where: {
            id: shapeId,
            roomId: roomId,
          },
        });

        if (!existingShape) return;

        await client.shapes.delete({
          where: {
            id: shapeId,
          },
        });

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
      }
    }
  });

  ws.on("close", () => {
    // Check all rooms user was in and broadcast leave?
    // We didn't track room leave on close strictly, but we should cleaning up.
    const userIndex = users.findIndex((user) => user.ws === ws);
    if (userIndex !== -1) {
      const user = users[userIndex];
      // For each room this user was in, we should ideally notify others?
      // Since we don't hold room->users map explicitly, we iterate.
      if (user) {
        user.rooms.forEach(roomId => {
            // Broadcast to this room
            const roomUsers = users.filter(u => u.rooms.includes(roomId) && u.userId !== user.userId);
            const remainingUsersList = roomUsers.map(u => ({ userId: u.userId }));
            roomUsers.forEach(u => {
                    u.ws.send(JSON.stringify({
                        type: "usersList",
                        users: remainingUsersList,
                        roomId
                    }));
                });
        });
      }
      users.splice(userIndex, 1);
    }
  });
});

