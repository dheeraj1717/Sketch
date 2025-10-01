"use client";
import { WS_BASE } from "@/utils/urls";
import { useEffect, useRef, useState } from "react";
import Canvas from "./Canvas";
import Header from "./Header";

export function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>("");

  const handleSelectTool = (tool: string) => {
    if(tool === selectedTool) {
      setSelectedTool("");
      return
    }
    setSelectedTool(tool);
  }

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwYjkyZGZhZC04NmI0LTQ3ZjQtODQwZi03NzMxYWY4N2MxNGMiLCJpYXQiOjE3NTkyOTc0MjUsImV4cCI6MTc1OTM4MzgyNX0.Ou6DHIu6Nw1v2WM0KQE5aM65LCCzcsTzco5GGFkgBxI`);
    ws.onopen = () => {
      setSocket(ws);
      ws.send(JSON.stringify({ type: "joinRoom", roomId }));
    };
  }, [roomId]);

  if (!socket) return <div>Connecting to server...</div>;
  
  return (
    <div>
      <Header handleSelectTool={handleSelectTool} selectedTool={selectedTool} />
      <Canvas roomId={roomId} socket={socket} selectedTool={selectedTool} />
    </div>
  );
}