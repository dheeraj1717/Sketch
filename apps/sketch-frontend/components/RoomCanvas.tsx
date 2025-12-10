"use client";
import { WS_BASE } from "@/utils/urls";
import { useEffect, useRef, useState } from "react";
import Canvas from "./Canvas";
import Header from "./Header";
import { useAuth } from "@/context/AuthContext";

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

  const { token } = useAuth();
  
  useEffect(() => {
    // If we have a token, we use it. If not, we send an empty string/undefined, which backend now handles as guest.
    // We do NOT return early anymore, so guests can connect.
    const tokenParam = token ? `?token=${token}` : "";
    const ws = new WebSocket(`${WS_BASE}${tokenParam}`);
    
    ws.onopen = () => {
      setSocket(ws);
      ws.send(JSON.stringify({ type: "joinRoom", roomId }));
    };
    
    return () => {
        ws.close();
    }
  }, [roomId, token]);

  if (!socket) return <div>Connecting to server...</div>;
  
  return (
    <div>
      <Header handleSelectTool={handleSelectTool} selectedTool={selectedTool} />
      <Canvas roomId={roomId} socket={socket} selectedTool={selectedTool} />
    </div>
  );
}