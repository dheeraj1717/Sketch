import { LucideIcon } from "lucide-react";

interface InforCardProps {
  Logo: LucideIcon;
  title: string;
  description: string;
}
const InforCard = ({ Logo, title, description }: InforCardProps) => {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 w-full flex flex-col items-center">
      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
        <Logo className="w-6 h-6 text-purple-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">
        {title}
      </h3>
      <p className="text-gray-600">
        {description}
      </p>
    </div>
  );
};

export default InforCard;
