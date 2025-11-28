import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Paintbrush } from "lucide-react";

interface BrushSizeControlProps {
  size: number;
  onChange: (size: number) => void;
}

export const BrushSizeControl = ({ size, onChange }: BrushSizeControlProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="glass-panel border-border/40"
        >
          <Paintbrush className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="left" className="w-48 glass-panel border-border/40 z-[1100]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Brush Size</span>
            <span className="text-sm text-muted-foreground">{size}px</span>
          </div>
          <Slider
            value={[size]}
            onValueChange={(values) => onChange(values[0])}
            min={1}
            max={20}
            step={1}
            className="w-full"
          />
          <div className="flex justify-center">
            <div
              className="rounded-full bg-foreground transition-all"
              style={{ width: size * 2, height: size * 2 }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
