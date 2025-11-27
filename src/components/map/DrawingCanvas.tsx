import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Circle, Line, Polygon, IText, FabricObject, Point } from "fabric";
import { DrawingTool } from "@/types/drawing";

interface DrawingCanvasProps {
  activeTool: DrawingTool;
  activeColor: string;
  brushSize: number;
  onHistoryChange: (canUndo: boolean, canRedo: boolean) => void;
  onClear: () => void;
  clearTrigger: number;
  undoTrigger: number;
  redoTrigger: number;
  screenshotTrigger: number;
  onScreenshotReady: (dataUrl: string) => void;
}

export const DrawingCanvas = ({
  activeTool,
  activeColor,
  brushSize,
  onHistoryChange,
  clearTrigger,
  undoTrigger,
  redoTrigger,
  screenshotTrigger,
  onScreenshotReady,
}: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const polygonPointsRef = useRef<Point[]>([]);
  const tempPolygonRef = useRef<Polygon | null>(null);
  const distanceLineRef = useRef<Line | null>(null);
  const distanceTextRef = useRef<IText | null>(null);
  const laserTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      selection: activeTool === 'select',
      backgroundColor: null,
    });

    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = brushSize;
    }

    fabricCanvasRef.current = canvas;

    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);

    // Save initial state
    saveHistory();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  // Save history after object modifications
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const handleObjectAdded = () => {
      if (activeTool !== 'polygon' && activeTool !== 'distance') {
        saveHistory();
      }
    };

    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:modified', saveHistory);
    canvas.on('object:removed', saveHistory);

    return () => {
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:modified', saveHistory);
      canvas.off('object:removed', saveHistory);
    };
  }, [activeTool]);

  const saveHistory = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const json = JSON.stringify(canvas.toJSON());
    
    // Remove any states after current index
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    
    // Add new state
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;

    // Limit history to 50 states
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
      historyIndexRef.current--;
    }

    updateHistoryState();
  };

  const updateHistoryState = () => {
    const canUndo = historyIndexRef.current > 0;
    const canRedo = historyIndexRef.current < historyRef.current.length - 1;
    onHistoryChange(canUndo, canRedo);
  };

  // Handle undo trigger
  useEffect(() => {
    if (undoTrigger === 0) return;
    
    const canvas = fabricCanvasRef.current;
    if (!canvas || historyIndexRef.current <= 0) return;

    historyIndexRef.current--;
    const state = historyRef.current[historyIndexRef.current];
    canvas.loadFromJSON(state, () => {
      canvas.renderAll();
      updateHistoryState();
    });
  }, [undoTrigger]);

  // Handle redo trigger
  useEffect(() => {
    if (redoTrigger === 0) return;
    
    const canvas = fabricCanvasRef.current;
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;

    historyIndexRef.current++;
    const state = historyRef.current[historyIndexRef.current];
    canvas.loadFromJSON(state, () => {
      canvas.renderAll();
      updateHistoryState();
    });
  }, [redoTrigger]);

  // Handle clear trigger
  useEffect(() => {
    if (clearTrigger === 0) return;
    
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.clear();
    canvas.backgroundColor = null;
    historyRef.current = [];
    historyIndexRef.current = -1;
    saveHistory();
  }, [clearTrigger]);

  // Handle screenshot trigger
  useEffect(() => {
    if (screenshotTrigger === 0) return;
    
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    onScreenshotReady(dataUrl);
  }, [screenshotTrigger]);

  // Update tool settings
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Reset polygon drawing
    polygonPointsRef.current = [];
    if (tempPolygonRef.current) {
      canvas.remove(tempPolygonRef.current);
      tempPolygonRef.current = null;
    }

    // Reset distance tool
    if (distanceLineRef.current) {
      canvas.remove(distanceLineRef.current);
      distanceLineRef.current = null;
    }
    if (distanceTextRef.current) {
      canvas.remove(distanceTextRef.current);
      distanceTextRef.current = null;
    }

    canvas.isDrawingMode = activeTool === 'freehand' || activeTool === 'highlighter';
    canvas.selection = activeTool === 'select';

    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = activeTool === 'highlighter' 
        ? activeColor + '4D' // 30% opacity
        : activeColor;
      canvas.freeDrawingBrush.width = activeTool === 'highlighter' ? brushSize * 3 : brushSize;
    }

    // Mouse event handlers
    const handleMouseDown = (e: any) => {
      if (!e.pointer) return;
      const pointer = e.pointer;

      if (activeTool === 'polygon') {
        handlePolygonClick(pointer);
      } else if (activeTool === 'arrow') {
        handleArrowStart(pointer);
      } else if (activeTool === 'text') {
        handleTextClick(pointer);
      } else if (activeTool === 'eraser') {
        handleEraserClick(e);
      } else if (activeTool === 'distance') {
        handleDistanceStart(pointer);
      } else if (activeTool === 'circle') {
        handleCircleStart(pointer);
      } else if (activeTool === 'laser') {
        handleLaserPoint(pointer);
      }
    };

    const handleMouseMove = (e: any) => {
      if (!e.pointer) return;
      
      if (activeTool === 'distance' && distanceLineRef.current) {
        updateDistanceLine(e.pointer);
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
    };
  }, [activeTool, activeColor, brushSize]);

  const handlePolygonClick = (pointer: Point) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    polygonPointsRef.current.push(new Point(pointer.x, pointer.y));

    if (tempPolygonRef.current) {
      canvas.remove(tempPolygonRef.current);
    }

    if (polygonPointsRef.current.length > 1) {
      const polygon = new Polygon(polygonPointsRef.current, {
        fill: activeColor + '33',
        stroke: activeColor,
        strokeWidth: 2,
        selectable: false,
      });
      tempPolygonRef.current = polygon;
      canvas.add(polygon);
      canvas.renderAll();
    }
  };

  const handleArrowStart = (pointer: Point) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const startPoint = new Point(pointer.x, pointer.y);
    let isDrawing = true;
    let line: Line | null = null;
    let arrowHead: Polygon | null = null;

    const handleMove = (e: any) => {
      if (!isDrawing || !e.pointer) return;

      if (line) canvas.remove(line);
      if (arrowHead) canvas.remove(arrowHead);

      const endPoint = e.pointer;
      
      line = new Line([startPoint.x, startPoint.y, endPoint.x, endPoint.y], {
        stroke: activeColor,
        strokeWidth: brushSize,
        selectable: false,
      });

      // Calculate arrow head
      const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
      const headLength = 15;
      const headWidth = 10;

      const arrowPoints = [
        new Point(endPoint.x, endPoint.y),
        new Point(
          endPoint.x - headLength * Math.cos(angle - Math.PI / 6),
          endPoint.y - headLength * Math.sin(angle - Math.PI / 6)
        ),
        new Point(
          endPoint.x - headLength * Math.cos(angle + Math.PI / 6),
          endPoint.y - headLength * Math.sin(angle + Math.PI / 6)
        ),
      ];

      arrowHead = new Polygon(arrowPoints, {
        fill: activeColor,
        selectable: false,
      });

      canvas.add(line);
      canvas.add(arrowHead);
      canvas.renderAll();
    };

    const handleUp = () => {
      isDrawing = false;
      canvas.off('mouse:move', handleMove);
      canvas.off('mouse:up', handleUp);
      saveHistory();
    };

    canvas.on('mouse:move', handleMove);
    canvas.on('mouse:up', handleUp);
  };

  const handleTextClick = (pointer: Point) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const text = new IText('Text', {
      left: pointer.x,
      top: pointer.y,
      fill: activeColor,
      fontSize: brushSize * 6,
      fontFamily: 'Inter, sans-serif',
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    canvas.renderAll();
  };

  const handleEraserClick = (e: any) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !e.target) return;

    canvas.remove(e.target);
    canvas.renderAll();
  };

  const handleDistanceStart = (pointer: Point) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (distanceLineRef.current) {
      canvas.remove(distanceLineRef.current);
      distanceLineRef.current = null;
    }
    if (distanceTextRef.current) {
      canvas.remove(distanceTextRef.current);
      distanceTextRef.current = null;
    }

    const line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
      stroke: activeColor,
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: false,
    });

    distanceLineRef.current = line;
    canvas.add(line);

    const handleUp = () => {
      if (distanceLineRef.current) {
        distanceLineRef.current.set({ selectable: true });
      }
      if (distanceTextRef.current) {
        distanceTextRef.current.set({ selectable: true });
      }
      canvas.off('mouse:up', handleUp);
      saveHistory();
    };

    canvas.on('mouse:up', handleUp);
  };

  const updateDistanceLine = (pointer: Point) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !distanceLineRef.current) return;

    const line = distanceLineRef.current;
    const coords = line.calcLinePoints();
    line.set({ x2: pointer.x - line.left!, y2: pointer.y - line.top! });

    const distance = Math.sqrt(
      Math.pow(pointer.x - (line.left! + coords.x1), 2) +
      Math.pow(pointer.y - (line.top! + coords.y1), 2)
    );

    const distanceInMeters = (distance * 10).toFixed(0); // Approximate scale

    if (distanceTextRef.current) {
      canvas.remove(distanceTextRef.current);
    }

    const midX = (line.left! + coords.x1 + pointer.x) / 2;
    const midY = (line.top! + coords.y1 + pointer.y) / 2;

    const text = new IText(`${distanceInMeters}m`, {
      left: midX,
      top: midY - 20,
      fill: activeColor,
      fontSize: 16,
      fontFamily: 'Inter, sans-serif',
      backgroundColor: 'white',
      selectable: false,
    });

    distanceTextRef.current = text;
    canvas.add(text);
    canvas.renderAll();
  };

  const handleCircleStart = (pointer: Point) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const startPoint = new Point(pointer.x, pointer.y);
    let isDrawing = true;
    let circle: Circle | null = null;
    let radiusText: IText | null = null;

    const handleMove = (e: any) => {
      if (!isDrawing || !e.pointer) return;

      if (circle) canvas.remove(circle);
      if (radiusText) canvas.remove(radiusText);

      const radius = Math.sqrt(
        Math.pow(e.pointer.x - startPoint.x, 2) +
        Math.pow(e.pointer.y - startPoint.y, 2)
      );

      circle = new Circle({
        left: startPoint.x - radius,
        top: startPoint.y - radius,
        radius: radius,
        fill: activeColor + '1A',
        stroke: activeColor,
        strokeWidth: 2,
        selectable: false,
      });

      const radiusInMeters = (radius * 10).toFixed(0);
      radiusText = new IText(`${radiusInMeters}m`, {
        left: startPoint.x + radius + 10,
        top: startPoint.y,
        fill: activeColor,
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        backgroundColor: 'white',
        selectable: false,
      });

      canvas.add(circle);
      canvas.add(radiusText);
      canvas.renderAll();
    };

    const handleUp = () => {
      isDrawing = false;
      if (circle) circle.set({ selectable: true });
      if (radiusText) radiusText.set({ selectable: true });
      canvas.off('mouse:move', handleMove);
      canvas.off('mouse:up', handleUp);
      saveHistory();
    };

    canvas.on('mouse:move', handleMove);
    canvas.on('mouse:up', handleUp);
  };

  const handleLaserPoint = (pointer: Point) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const dot = new Circle({
      left: pointer.x - 5,
      top: pointer.y - 5,
      radius: 5,
      fill: '#EF4444',
      selectable: false,
      opacity: 1,
    });

    canvas.add(dot);
    canvas.renderAll();

    // Fade out and remove after 1 second
    if (laserTimeoutRef.current) {
      clearTimeout(laserTimeoutRef.current);
    }

    laserTimeoutRef.current = setTimeout(() => {
      const fadeOut = () => {
        const currentOpacity = dot.opacity || 1;
        if (currentOpacity > 0) {
          dot.set({ opacity: currentOpacity - 0.05 });
          canvas.renderAll();
          requestAnimationFrame(fadeOut);
        } else {
          canvas.remove(dot);
          canvas.renderAll();
        }
      };
      fadeOut();
    }, 500);
  };

  // Complete polygon on double click
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const handleDblClick = () => {
      if (activeTool === 'polygon' && polygonPointsRef.current.length > 2) {
        if (tempPolygonRef.current) {
          tempPolygonRef.current.set({ selectable: true });
        }
        polygonPointsRef.current = [];
        tempPolygonRef.current = null;
        saveHistory();
      }
    };

    canvas.on('mouse:dblclick', handleDblClick);

    return () => {
      canvas.off('mouse:dblclick', handleDblClick);
    };
  }, [activeTool]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-auto"
      style={{ zIndex: 1000 }}
    />
  );
};
