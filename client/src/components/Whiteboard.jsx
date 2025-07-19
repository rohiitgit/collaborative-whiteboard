import React, { useState, useEffect } from "react";
import { Users, Palette, Wifi, WifiOff, LogOut } from "lucide-react";
import DrawingCanvas from "./DrawingCanvas";
import Toolbar from "./Toolbar";
import UserCursors from "./UserCursors";

const Whiteboard = ({ socket, roomId, isConnected, onLeaveRoom }) => {
  const [userCount, setUserCount] = useState(1);
  const [users, setUsers] = useState({});
  const [currentColor, setCurrentColor] = useState("#000000");
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(3);
  const [canvasRef, setCanvasRef] = useState(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for user count updates
    socket.on("user-count", (count) => {
      setUserCount(count);
    });

    // Listen for user cursors
    socket.on("cursor-update", (data) => {
      setUsers((prev) => ({
        ...prev,
        [data.userId]: {
          ...data,
          lastSeen: Date.now(),
        },
      }));
    });

    // Listen for user disconnect
    socket.on("user-left", (userId) => {
      setUsers((prev) => {
        const newUsers = { ...prev };
        delete newUsers[userId];
        return newUsers;
      });
    });

    // Clean up inactive cursors
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setUsers((prev) => {
        const newUsers = {};
        Object.keys(prev).forEach((userId) => {
          if (now - prev[userId].lastSeen < 5000) {
            // 5 seconds
            newUsers[userId] = prev[userId];
          }
        });
        return newUsers;
      });
    }, 1000);

    return () => {
      socket.off("user-count");
      socket.off("cursor-update");
      socket.off("user-left");
      clearInterval(cleanupInterval);
    };
  }, [socket]);

  const handleCursorMove = (x, y) => {
    if (socket) {
      socket.emit("cursor-move", { x, y, roomId });
    }
  };

  const handleClearCanvas = () => {
    if (socket && canvasRef) {
      socket.emit("clear-canvas", roomId);
      // Clear local canvas immediately
      const canvas = canvasRef;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Collaborative Whiteboard</h1>
                  <p className="text-sm text-gray-500">Room: {roomId}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {userCount} user{userCount !== 1 ? "s" : ""}
                </span>
              </div>

              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {isConnected ? (
                  <Wifi className="w-4 h-4" />
                ) : (
                  <WifiOff className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>

              <button
                onClick={onLeaveRoom}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-200 hover:scale-105 font-medium"
              >
                <LogOut className="w-4 h-4" />
                Leave Room
              </button>
            </div>
          </div>
        </div>
      </header>

      <Toolbar
        currentColor={currentColor}
        setCurrentColor={setCurrentColor}
        currentStrokeWidth={currentStrokeWidth}
        setCurrentStrokeWidth={setCurrentStrokeWidth}
        onClearCanvas={handleClearCanvas}
      />

      <div className="flex-1 p-6">
        <div className="h-full max-w-6xl mx-auto relative">
          <div className="h-full bg-white rounded-xl shadow-lg border border-gray-200 relative overflow-hidden">
            <DrawingCanvas
              socket={socket}
              roomId={roomId}
              currentColor={currentColor}
              currentStrokeWidth={currentStrokeWidth}
              onCursorMove={handleCursorMove}
              onCanvasRef={setCanvasRef}
            />
            <UserCursors users={users} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;