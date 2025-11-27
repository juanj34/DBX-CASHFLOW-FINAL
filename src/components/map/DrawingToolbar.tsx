import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  MousePointer2, 
  Pencil, 
  Pentagon, 
  MoveRight, 
  Type, 
  Highlighter, 
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Ruler,
  CircleDot,
  Target,
  Download,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { DrawingTool } from "@/types/drawing";
import { ColorPicker } from "./ColorPicker";
import { BrushSizeControl } from "./BrushSizeControl";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  activeColor: string;
  brushSize: number;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: DrawingTool) => void;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onScreenshot: () => void;
}

export const DrawingToolbar = ({
  activeTool,
  activeColor,
  brushSize,
  canUndo,
  canRedo,
  onToolChange,
  onColorChange,
  onBrushSizeChange,
  onUndo,
  onRedo,
  onClear,
  onScreenshot,
}: DrawingToolbarProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const tools = [
    { id: 'select' as DrawingTool, icon: MousePointer2, label: 'Select' },
    { id: 'freehand' as DrawingTool, icon: Pencil, label: 'Draw' },
    { id: 'polygon' as DrawingTool, icon: Pentagon, label: 'Polygon' },
    { id: 'arrow' as DrawingTool, icon: MoveRight, label: 'Arrow' },
    { id: 'text' as DrawingTool, icon: Type, label: 'Text' },
    { id: 'highlighter' as DrawingTool, icon: Highlighter, label: 'Highlight' },
    { id: 'distance' as DrawingTool, icon: Ruler, label: 'Distance' },
    { id: 'circle' as DrawingTool, icon: CircleDot, label: 'Circle' },
    { id: 'laser' as DrawingTool, icon: Target, label: 'Laser' },
    { id: 'eraser' as DrawingTool, icon: Eraser, label: 'Eraser' },
  ];

  return (
    <div 
      className={cn(
        "fixed bottom-6 right-6 z-[1001] glass-panel border border-border/40 rounded-2xl p-2 transition-all duration-300",
        isExpanded ? "w-auto" : "w-14"
      )}
    >
      <div className="flex flex-col gap-1">
        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-10 w-10 hover:bg-accent/50"
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>

        {isExpanded && (
          <>
            <Separator className="my-1" />

            {/* Drawing tools */}
            {tools.map((tool) => (
              <Button
                key={tool.id}
                variant={activeTool === tool.id ? "default" : "ghost"}
                size="icon"
                onClick={() => onToolChange(tool.id)}
                className="h-10 w-10"
                title={tool.label}
              >
                <tool.icon className="w-4 h-4" />
              </Button>
            ))}

            <Separator className="my-1" />

            {/* Color picker */}
            <ColorPicker color={activeColor} onChange={onColorChange} />

            {/* Brush size */}
            <BrushSizeControl size={brushSize} onChange={onBrushSizeChange} />

            <Separator className="my-1" />

            {/* History controls */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-10 w-10"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-10 w-10"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </Button>

            <Separator className="my-1" />

            {/* Screenshot */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onScreenshot}
              className="h-10 w-10"
              title="Export Screenshot"
            >
              <Download className="w-4 h-4" />
            </Button>

            {/* Clear all */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Clear All"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
