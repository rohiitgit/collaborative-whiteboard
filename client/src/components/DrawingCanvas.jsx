import React, { useRef, useEffect, useState } from "react";

const DrawingCanvas = ({
  socket,
  roomId,
  currentColor,
  currentStrokeWidth,
  onCursorMove,
  onCanvasRef,
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [lastPoint, setLastPoint] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Notify parent about canvas ref
    onCanvasRef(canvas);

    // Set up canvas context
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [onCanvasRef]);

  useEffect(() => {
    if (!socket) return;

    // Listen for drawing events from other users
    socket.on("draw-start", (data) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      ctx.strokeStyle = data.color;
      ctx.lineWidth = data.strokeWidth;
      ctx.beginPath();
      ctx.moveTo(data.x, data.y);
    });

    socket.on("draw-move", (data) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      ctx.lineTo(data.x, data.y);
      ctx.stroke();
    });

    socket.on("draw-end", () => {
      // Drawing ended, nothing specific to do
    });

    socket.on("clear-canvas", () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Load existing drawing data
    socket.on("drawing-data", (drawingCommands) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Clear canvas first
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Replay drawing commands
      drawingCommands.forEach((command) => {
        if (command.type === "stroke") {
          ctx.strokeStyle = command.data.color;
          ctx.lineWidth = command.data.strokeWidth;
          ctx.beginPath();

          const points = command.data.points;
          if (points && points.length > 0) {
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
              ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
          }
        }
      });
    });

    return () => {
      socket.off("draw-start");
      socket.off("draw-move");
      socket.off("draw-end");
      socket.off("clear-canvas");
      socket.off("drawing-data");
    };
  }, [socket]);

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;

    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const coordinates = getCanvasCoordinates(e);
    setIsDrawing(true);
    setLastPoint(coordinates);
    setCurrentPath([coordinates]);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentStrokeWidth;
    ctx.beginPath();
    ctx.moveTo(coordinates.x, coordinates.y);

    // Emit draw start to other users
    if (socket) {
      socket.emit("draw-start", {
        roomId,
        x: coordinates.x,
        y: coordinates.y,
        color: currentColor,
        strokeWidth: currentStrokeWidth,
      });
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;

    e.preventDefault();
    const coordinates = getCanvasCoordinates(e);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.lineTo(coordinates.x, coordinates.y);
    ctx.stroke();

    // Update current path
    setCurrentPath((prev) => [...prev, coordinates]);
    setLastPoint(coordinates);

    // Emit draw move to other users
    if (socket) {
      socket.emit("draw-move", {
        roomId,
        x: coordinates.x,
        y: coordinates.y,
      });
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;

    e.preventDefault();
    setIsDrawing(false);

    // Emit draw end and save the complete stroke
    if (socket && currentPath.length > 0) {
      socket.emit("draw-end", {
        roomId,
        strokeData: {
          points: currentPath,
          color: currentColor,
          strokeWidth: currentStrokeWidth,
        },
      });
    }

    setCurrentPath([]);
    setLastPoint(null);
  };

  const handleMouseMove = (e) => {
    const coordinates = getCanvasCoordinates(e);
    onCursorMove(coordinates.x, coordinates.y);

    if (isDrawing) {
      draw(e);
    }
  };

  const handleTouchMove = (e) => {
    const coordinates = getCanvasCoordinates(e);
    onCursorMove(coordinates.x, coordinates.y);

    if (isDrawing) {
      draw(e);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full bg-white rounded-lg shadow-inner cursor-crosshair touch-none"
      style={{ width: "100%", height: "100%" }}
      onMouseDown={startDrawing}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={handleTouchMove}
      onTouchEnd={stopDrawing}
    />
  );
};

export default DrawingCanvas;
