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
  const polygonDotsRef = useRef<Circle[]>([]);
  const tempPolygonRef = useRef<Polygon | null>(null);
  const distanceLineRef = useRef<Line | null>(null);
  const distancePointARef = useRef<Circle | null>(null);
  const distanceStateRef = useRef<'idle' | 'settingPointB'>('idle');
  const distanceTextRef = useRef<IText | null>(null);
  const distanceStartPointRef = useRef<Point | null>(null);
  const laserTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeColorRef = useRef(activeColor);
  const brushSizeRef = useRef(brushSize);

  // Update refs when props change
  useEffect(() => {
    activeColorRef.current = activeColor;
  }, [activeColor]);

  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);

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
    
    // Reset all tool states
    polygonPointsRef.current = [];
    polygonDotsRef.current = [];
    tempPolygonRef.current = null;
    distanceStateRef.current = 'idle';
    distanceLineRef.current = null;
    distancePointARef.current = null;
    distanceTextRef.current = null;
    distanceStartPointRef.current = null;
    
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
    
    // Clean up polygon dots
    polygonDotsRef.current.forEach(dot => canvas.remove(dot));
    polygonDotsRef.current = [];

    // Reset distance tool
    if (distanceLineRef.current) {
      canvas.remove(distanceLineRef.current);
      distanceLineRef.current = null;
    }
    if (distancePointARef.current) {
      canvas.remove(distancePointARef.current);
      distancePointARef.current = null;
    }
    if (distanceTextRef.current) {
      canvas.remove(distanceTextRef.current);
      distanceTextRef.current = null;
    }
    distanceStateRef.current = 'idle';

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

    // Add visual dot at click point using current color
    const dot = new Circle({
      left: pointer.x - 6,
      top: pointer.y - 6,
      radius: 6,
      fill: activeColorRef.current,
      stroke: 'white',
      strokeWidth: 2,
      selectable: false,
    });
    canvas.add(dot);
    polygonDotsRef.current.push(dot);

    if (tempPolygonRef.current) {
      canvas.remove(tempPolygonRef.current);
    }

    if (polygonPointsRef.current.length > 1) {
      const polygon = new Polygon(polygonPointsRef.current, {
        fill: activeColorRef.current + '33',
        stroke: activeColorRef.current,
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
        stroke: activeColorRef.current,
        strokeWidth: brushSizeRef.current,
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
        fill: activeColorRef.current,
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
      fill: activeColorRef.current,
      fontSize: brushSizeRef.current * 6,
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

    // If setting point A (idle state)
    if (distanceStateRef.current === 'idle') {
      // Store the start point
      distanceStartPointRef.current = new Point(pointer.x, pointer.y);
      
      // Create point A marker
      const pointA = new Circle({
        left: pointer.x - 6,
        top: pointer.y - 6,
        radius: 6,
        fill: activeColorRef.current,
        stroke: 'white',
        strokeWidth: 2,
        selectable: false,
      });
      canvas.add(pointA);
      distancePointARef.current = pointA;

      // Create initial line
      const line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
        stroke: activeColorRef.current,
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
      });
      canvas.add(line);
      distanceLineRef.current = line;
      
      distanceStateRef.current = 'settingPointB';
      canvas.renderAll();
    } 
    // If setting point B
    else if (distanceStateRef.current === 'settingPointB' && distanceLineRef.current) {
      // Finalize the measurement
      const line = distanceLineRef.current;
      line.set({ 
        selectable: true,
        strokeDashArray: [] // Make solid
      });
      
      // Create point B marker
      const pointB = new Circle({
        left: pointer.x - 6,
        top: pointer.y - 6,
        radius: 6,
        fill: activeColorRef.current,
        stroke: 'white',
        strokeWidth: 2,
        selectable: false,
      });
      canvas.add(pointB);

      if (distanceTextRef.current) {
        distanceTextRef.current.set({ selectable: true });
      }

      // Reset state
      distanceStateRef.current = 'idle';
      distanceLineRef.current = null;
      distancePointARef.current = null;
      distanceTextRef.current = null;
      distanceStartPointRef.current = null;
      
      saveHistory();
      canvas.renderAll();
    }
  };

  const updateDistanceLine = (pointer: Point) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !distanceLineRef.current || !distanceStartPointRef.current || distanceStateRef.current !== 'settingPointB') return;

    const line = distanceLineRef.current;
    const startPoint = distanceStartPointRef.current;
    
    // Update line endpoint
    line.set({ 
      x2: pointer.x - startPoint.x,
      y2: pointer.y - startPoint.y
    });

    // Calculate distance
    const distance = Math.sqrt(
      Math.pow(pointer.x - startPoint.x, 2) +
      Math.pow(pointer.y - startPoint.y, 2)
    );

    const distanceInMeters = (distance * 10).toFixed(0); // Approximate scale

    // Remove old text if exists
    if (distanceTextRef.current) {
      canvas.remove(distanceTextRef.current);
    }

    // Calculate midpoint
    const midX = (startPoint.x + pointer.x) / 2;
    const midY = (startPoint.y + pointer.y) / 2;

    // Create new text
    const text = new IText(`${distanceInMeters}m`, {
      left: midX,
      top: midY - 20,
      fill: activeColorRef.current,
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
        fill: activeColorRef.current + '1A',
        stroke: activeColorRef.current,
        strokeWidth: 2,
        selectable: false,
      });

      const radiusInMeters = (radius * 10).toFixed(0);
      radiusText = new IText(`${radiusInMeters}m`, {
        left: startPoint.x + radius + 10,
        top: startPoint.y,
        fill: activeColorRef.current,
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
