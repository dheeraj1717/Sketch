"use client";
import { WS_BASE } from "@/utils/urls";
import { useEffect, useState } from "react";
import Canvas from "./Canvas";
import Header from "./Header";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Shield, ShieldAlert, Users, X, Ban, LogOut } from "lucide-react";

type User = {
  userId: string;
};

export function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>("rect");
  const [isAdmin, setIsAdmin] = useState(false);
  const [participants, setParticipants] = useState<User[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);

  const { token, isLoggedIn } = useAuth();
  const router = useRouter();

  const handleSelectTool = (tool: string) => {
    if (tool === selectedTool) {
      setSelectedTool("");
      return;
    }
    setSelectedTool(tool);
  };

  useEffect(() => {
    // GUEST MODE: If not logged in, we do NOT connect to WS.
    if (!token && !isLoggedIn) {
      return;
    }

    const ws = new WebSocket(`${WS_BASE}?token=${token}`);

    ws.onopen = () => {
      setSocket(ws);
      ws.send(JSON.stringify({ type: "joinRoom", roomId }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "usersList") {
        setParticipants(message.users);
      }
      if (message.type === "roomState") {
        setIsAdmin(message.amIAdmin);
      }
      if (message.type === "kicked") {
        alert("You have been kicked from the room.");
        router.push("/");
      }
    };

    return () => {
      ws.close();
    };
  }, [roomId, token, isLoggedIn, router]);

  // Admin Actions
  const handleKick = (userId: string) => {
    if (socket) {
      socket.send(JSON.stringify({ type: "kickUser", userId, roomId }));
    }
  };

  const handleBlock = (userId: string) => {
    if (socket) {
      socket.send(JSON.stringify({ type: "blockUser", userId, roomId }));
    }
  };

  // Show loading only if logged in AND socket is expected but not connected yet
  // In guest mode, we proceed without socket
  if (!socket && isLoggedIn && token)
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p className="text-gray-500">Connecting to collaborative server...</p>
      </div>
    );

  return (
    <div>
      <Header handleSelectTool={handleSelectTool} selectedTool={selectedTool} />

      {/* Admin Controls Button */}
      {isAdmin && (
        <div className="fixed top-24 left-4 z-20">
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="bg-white p-3 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
            title="Manage Participants"
          >
            <Users className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Admin Participants Modal */}
      {isAdmin && showParticipants && (
        <div className="fixed top-24 left-20 z-20 bg-white p-4 rounded-xl shadow-2xl border border-gray-100 w-72">
          <div className="flex items-center justify-between mb-4 border-b pb-2">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              Participants ({participants.length})
            </h3>
            <button
              onClick={() => setShowParticipants(false)}
              className="text-gray-400 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {participants.map((user) => (
              <div
                key={user.userId}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group"
              >
                <span
                  className="text-sm font-medium text-gray-700 truncate w-32"
                  title={user.userId}
                >
                  User {user.userId.slice(0, 4)}...
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleBlock(user.userId)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    title="Block Drawing"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleKick(user.userId)}
                    className="p-1.5 text-gray-600 hover:bg-gray-200 rounded"
                    title="Kick User"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {participants.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">
                No other users
              </p>
            )}
          </div>
        </div>
      )}

      <Canvas roomId={roomId} socket={socket} selectedTool={selectedTool} />

      {!isLoggedIn && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-yellow-100 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-full text-sm shadow-lg pointer-events-none">
          Offline Mode • Changes will not be saved
        </div>
      )}
    </div>
  );
}
