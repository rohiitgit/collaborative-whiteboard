import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import RoomJoin from "./components/RoomJoin";
import Whiteboard from "./components/Whiteboard";

const App = () => {
  const [socket, setSocket] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io("http://localhost:5000");

    newSocket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinRoom = async (roomId) => {
    if (!socket || !roomId) return;

    try {
      // Make API call to join/create room
      const response = await fetch("http://localhost:5000/api/rooms/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId }),
      });

      if (response.ok) {
        const roomData = await response.json();
        socket.emit("join-room", roomId);
        setCurrentRoom(roomData.roomId);
      } else {
        console.error("Failed to join room");
      }
    } catch (error) {
      console.error("Error joining room:", error);
    }
  };

  const leaveRoom = () => {
    if (socket && currentRoom) {
      socket.emit("leave-room", currentRoom);
      setCurrentRoom(null);
    }
  };

  if (!socket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-medium text-gray-700">
            Connecting...
          </span>
        </div>
      </div>
    );
  }

  if (!currentRoom) {
    return <RoomJoin onJoinRoom={joinRoom} isConnected={isConnected} />;
  }

  return (
    <Whiteboard
      socket={socket}
      roomId={currentRoom}
      isConnected={isConnected}
      onLeaveRoom={leaveRoom}
    />
  );
};

export default App;
