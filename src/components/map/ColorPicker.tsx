import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const PRESET_COLORS = [
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Yellow", value: "#FACC15" },
  { name: "Green", value: "#22C55E" },
  { name: "Blue", value: "#2563EB" },
  { name: "Purple", value: "#9333EA" },
  { name: "Pink", value: "#EC4899" },
  { name: "Black", value: "#000000" },
  { name: "White", value: "#FFFFFF" },
];

export const ColorPicker = ({ color, onChange }: ColorPickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="glass-panel border-border/40"
        >
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <div
              className="w-4 h-4 rounded border border-border"
              style={{ backgroundColor: color }}
            />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 glass-panel border-border/40">
        <div className="grid grid-cols-3 gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onChange(preset.value)}
              className="w-10 h-10 rounded-lg border-2 hover:scale-110 transition-transform"
              style={{
                backgroundColor: preset.value,
                borderColor: color === preset.value ? "#2563EB" : "#E5E7EB",
              }}
              title={preset.name}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
