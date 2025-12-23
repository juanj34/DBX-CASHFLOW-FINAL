import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandmarkInfoCardProps {
  landmark: {
    title: string;
    description?: string;
    image_url: string;
  };
  onClose: () => void;
}

export const LandmarkInfoCard = ({ landmark, onClose }: LandmarkInfoCardProps) => {
  return (
    <div 
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      data-info-card
    >
      <div 
        className="relative max-w-4xl w-[calc(100vw-2rem)] sm:w-[90vw] max-h-[85vh] bg-[#1a1f2e] border border-[#2a3142] rounded-xl shadow-2xl overflow-hidden mx-4 sm:mx-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Image */}
        <div className="w-full h-[60vh] max-h-[500px]">
          <img
            src={landmark.image_url}
            alt={landmark.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-2">
          <h2 className="text-2xl font-bold text-white">{landmark.title}</h2>
          {landmark.description && (
            <p className="text-gray-400">{landmark.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};
