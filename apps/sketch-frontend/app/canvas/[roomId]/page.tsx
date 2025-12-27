import { RoomCanvas } from "@/components/RoomCanvas";

const CanvasPage = async ({
  params,
}: {
  params: Promise<{
    roomId: string;
  }>;
}) => {
  const roomId = (await params).roomId;
  return <RoomCanvas roomId={roomId} />;
};

export default CanvasPage;
