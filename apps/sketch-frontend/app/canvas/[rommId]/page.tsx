import { RoomCanvas } from "@/components/RoomCanvas";

const CanvasPage = ({
  params,
}: {
  params: {
    roomId: string;
  };
}) => {
  const roomId = params.roomId;
  return <RoomCanvas roomId={roomId} />;
};

export default CanvasPage;
