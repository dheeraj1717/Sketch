"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/utils/urls";
import axios from "axios";
import { Trash2, ExternalLink, Calendar, Clock, Plus } from "lucide-react";
import Link from "next/link";

interface Room {
  id: string;
  slug: string;
  createdAt: string;
}

export default function History() {
  const { isLoggedIn, token } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If not logged in, redirect to home after a brief check? 
    // AuthContext usually handles initial load, but let's be safe.
    if (!isLoggedIn && !localStorage.getItem("accessToken")) {
         router.push("/");
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    async function fetchRooms() {
      if (!token) return;
      try {
        const res = await axios.get(`${API_BASE}/room/my-rooms`, {
            headers: { Authorization: token } // Assuming middleware checks header or cookie. Middleware usually checks header "Authorization".
        });
        setRooms(res.data.rooms);
      } catch (e) {
        console.error("Failed to fetch rooms", e);
      } finally {
        setLoading(false);
      }
    }
    fetchRooms();
  }, [token]);

  const handleDelete = async (roomId: string) => {
      if(!confirm("Are you sure you want to delete this room? This action cannot be undone.")) return;
      
      try {
          await axios.delete(`${API_BASE}/room/${roomId}`, {
              headers: { Authorization: token }
          });
          setRooms(prev => prev.filter(r => r.id !== roomId));
      } catch(e) {
          alert("Failed to delete room");
      }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Rooms</h1>
            <Link href="/" className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                <Plus className="w-4 h-4" />
                New Room
            </Link>
        </div>

        {rooms.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No rooms found</h3>
                <p className="text-gray-500 mb-6">Create your first room to start collaborating!</p>
                <Link href="/" className="text-purple-600 font-medium hover:underline">
                    Create Room
                </Link>
            </div>
        ) : (
            <div className="grid gap-4">
                {rooms.map(room => (
                    <div key={room.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                                {room.slug}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(room.createdAt).toLocaleDateString()}
                                </span>
                                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                                    ID: {room.id.slice(0, 8)}...
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <Link 
                                href={`/canvas/${room.id}`}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-2 font-medium text-sm"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Open
                            </Link>
                            <button 
                                onClick={() => handleDelete(room.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Room"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
