"use client";
import { WS_BASE } from "@/utils/urls";
import { useEffect, useRef, useState } from "react";
import Canvas from "./Canvas";
import Header from "./Header";

export function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>("rect");

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwYjkyZGZhZC04NmI0LTQ3ZjQtODQwZi03NzMxYWY4N2MxNGMiLCJpYXQiOjE3NTg0Njg0MTUsImV4cCI6MTc1ODU1NDgxNX0.BwCZRlSYrb84HCO56HewLfOBvUmXt-oqHzLQFjEV0Uw`);
    ws.onopen = () => {
      setSocket(ws);
      ws.send(JSON.stringify({ type: "joinRoom", roomId }));
    };
  }, [roomId]);

  if (!socket) return <div>Connecting to server...</div>;
  
  return (
    <div>
      <Header handleSetTool={setSelectedTool} selectedTool={selectedTool} />
      <Canvas roomId={roomId} socket={socket} selectedTool={selectedTool} />
    </div>
  );
}