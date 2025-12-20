"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/apiClient";
import { Trash2, ExternalLink, Calendar, Clock, Plus, Pencil, X } from "lucide-react";
import Link from "next/link";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useToast } from "@/context/ToastContext";
import { useCreateRoom } from "@/hooks/useCreateRoom";

interface Room {
  id: string;
  slug: string;
  createdAt: string;
}

export default function History() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

  // Rename Modal State
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [roomToRename, setRoomToRename] = useState<Room | null>(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!isLoggedIn && !localStorage.getItem("accessToken")) {
      router.push("/");
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await apiClient.get("/room/my-rooms");
        setRooms(res.data.rooms);
      } catch (e) {
        console.error("Failed to fetch rooms", e);
        showToast("Failed to fetch rooms", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchRooms();
  }, [showToast]);

  const handleDeleteClick = (roomId: string) => {
    setRoomToDelete(roomId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!roomToDelete) return;

    try {
      await apiClient.delete(`/room/delete/${roomToDelete}`);
      setRooms((prev) => prev.filter((r) => r.id !== roomToDelete));
      showToast("Room deleted successfully", "success");
    } catch (e) {
      showToast("Failed to delete room", "error");
    } finally {
      setIsDeleteModalOpen(false);
      setRoomToDelete(null);
    }
  };

  const handleRenameClick = (room: Room) => {
    setRoomToRename(room);
    setNewName(room.slug);
    setIsRenameModalOpen(true);
  };

  const confirmRename = async () => {
    if (!roomToRename || !newName.trim()) {
      showToast("Room name cannot be empty", "warning");
      return;
    }

    try {
      await apiClient.put(`/room/rename/${roomToRename.id}`, {
        name: newName,
      });

      setRooms((prev) =>
        prev.map((r) => (r.id === roomToRename.id ? { ...r, slug: newName } : r))
      );
      setIsRenameModalOpen(false);
      showToast("Room renamed successfully", "success");
    } catch (e: any) {
      if (e.response?.data?.message) {
        showToast(e.response.data.message, "error");
      } else {
        showToast("Failed to rename room", "error");
      }
    }
  };

  const { createRoom, loading: isCreating } = useCreateRoom();

  const handleCreateRoom = async () => {
    await createRoom();
  };

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
          <button
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {isCreating ? "Creating..." : "New Room"}
          </button>
        </div>

        {rooms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No rooms found</h3>
            <p className="text-gray-500 mb-6">Create your first room to start collaborating!</p>
            <button
              onClick={handleCreateRoom}
              className="text-purple-600 font-medium hover:underline cursor-pointer"
            >
              Create Room
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow"
              >
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRenameClick(room)}
                    className="p-2 text-gray-500 hover:bg-gray-100 hover:text-purple-600 rounded-lg transition-colors cursor-pointer"
                    title="Rename Room"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/canvas/${room.id}`}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-2 font-medium text-sm cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Open</span>
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(room.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Room"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Room"
          message="Are you sure you want to delete this room? This action cannot be undone and all drawings will be lost."
          confirmText="Delete"
          type="danger"
        />

        {/* Rename Modal */}
        {isRenameModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 scale-100 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Rename Room</h3>
                <button
                  onClick={() => setIsRenameModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter room name"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsRenameModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRename}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-sm shadow-purple-200 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
