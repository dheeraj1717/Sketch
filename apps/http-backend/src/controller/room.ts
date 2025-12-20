import express from "express";
import {
  AuthenticatedRequest,
  authMiddleware,
} from "../middleware/authMiddleware";
import { CreateRoomSchema } from "@repo/common/types";
const roomRouter: express.Router = express.Router();
import { prismaClient } from "@repo/db/client";
const client = prismaClient;

roomRouter.post(
  "/create-room",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({
        message: "Incorrect inputs",
      });
    }

    const userId = req.userId;

    const rooms = await client.room.findMany({
      where: {
        slug: parsedData.data.name,
      },
    });

    if (rooms.length > 0) {
      return res.status(400).json({
        message: "Room already exists",
      });
    }

    const room = await client.room.create({
      data: {
        slug: parsedData.data.name,
        adminId: userId!,
      },
    });

    if (!room) {
      return res.status(500).json({
        message: "Internal server error",
      });
    }
    res.status(200).json({
      roomId: room.id,
    });
  }
);

roomRouter.get("/canvas/:roomId", async (req: AuthenticatedRequest, res) => {
  const roomId = req.params.roomId;
  if (!roomId) {
    return res.status(400).json({
      message: "Incorrect inputs",
    });
  }
  const shapes = await client.shapes.findMany({
    where: {
      roomId: roomId,
    },
    take:1000,
  });
  res.status(200).json({ 
    shapes: shapes,
  });
});

roomRouter.get("/my-rooms", authMiddleware, async (req: AuthenticatedRequest, res) => {
    const userId = req.userId;
    try {
        const rooms = await client.room.findMany({
            where: {
                adminId: userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json({ rooms });
    } catch(e) {
        res.status(500).json({ message: "Internal server error" });
    }
});

roomRouter.delete("/delete/:roomId", authMiddleware, async (req: AuthenticatedRequest, res) => {
    const roomId = req.params.roomId;
    const userId = req.userId;

    try {
        const room = await client.room.findFirst({
            where: {
                id: roomId,
                adminId: userId
            }
        });

        if (!room) {
            return res.status(404).json({ message: "Room not found or unauthorized" });
        }

        // Delete shapes first (cascade ideally, but manual here to be safe if not configured)
        await client.shapes.deleteMany({
            where: { roomId: roomId }
        });

        await client.room.delete({
            where: { id: roomId }
        });

        res.status(200).json({ message: "Room deleted successfully" });
    } catch(e) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// Rename room
roomRouter.put("/rename/:roomId", authMiddleware, async (req: AuthenticatedRequest, res) => {
    const roomId = req.params.roomId;
    const userId = req.userId;
    const parsedData = CreateRoomSchema.safeParse(req.body);

    if (!parsedData.success) {
        return res.status(400).json({ message: "Incorrect inputs" });
    }

    try {
        const room = await client.room.findFirst({
            where: {
                id: roomId,
                adminId: userId
            }
        });

        if (!room) {
            return res.status(404).json({ message: "Room not found or unauthorized" });
        }

        // Check if new name is already taken
        const existingRoom = await client.room.findFirst({
            where: {
                slug: parsedData.data.name,
                NOT: {
                    id: roomId
                }
            }
        });

        if (existingRoom) {
            return res.status(409).json({ message: "Room name already exists" });
        }

        const updatedRoom = await client.room.update({
            where: { id: roomId },
            data: {
                slug: parsedData.data.name
            }
        });

        res.status(200).json({ message: "Room updated successfully", room: updatedRoom });
    } catch(e) {
        res.status(500).json({ message: "Internal server error" });
    }
});

export default roomRouter;
