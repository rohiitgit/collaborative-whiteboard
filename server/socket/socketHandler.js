const Room = require("../models/Room");

const activeRooms = new Map();
const userRooms = new Map();
const roomUsers = new Map();

const handleSocketConnection = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // joining a Room
    socket.on("join-room", async (roomId) => {
      try {
        console.log(`User ${socket.id} joining room ${roomId}`);
        //leaving prev roomU
        const prevRoom = userRooms.get(socket.id);
        if (prevRoom) {
          socket.leave(prevRoom);
          handleUserLeaveRoom(socket.id, prevRoom, io);
        }

        //join a new room
        socket.join(roomId);
        userRooms.set(socket.id, roomId);

        // adding user to room users tracking
        if (!roomUsers.has(roomId)) {
          roomUsers.set(roomId, new Set());
        }
        roomUsers.get(roomId).add(socket.id);

        //updating user count
        const userCount = roomUsers.get(roomId).size;
        io.to(roomId).emit("user-count", userCount);

        //send existing drawing data to the new user
        const room = await Room.findOne({ roomId });
        if (room && room.drawingData.length > 0) {
          socket.emit("drawing-data", room.drawingData);
        }

        console.log(`Room ${roomId} now has ${userCount} users`);
      } catch (error) {
        console.error("Error joining room", error);
        socket.emit("error", "Failed to join room");
      }
    });

    // leaving a room
    socket.on("leave-room", (roomId) => {
      console.log(`User ${socket.id} leaving room ${roomId}`);
      socket.leave(roomId);
      handleUserLeaveRoom(socket.id, roomId, io);
    });

    // cursor movement
    socket.on("cursor-move", (data) => {
      const { x, y, roomId } = data;

      socket.to(roomId).emit("cursor-update", {
        userId: socket.id,
        x,
        y,
      });
    });

    // drawing
    socket.on("draw-start", (data) => {
      const { roomId, x, y, color, strokeWidth } = data;

      socket.to(roomId).emit("draw-start", {
        x,
        y,
        color,
        strokeWidth,
      });
    });

    // drawing movement
    socket.on("draw-move", (data) => {
      const { roomId, x, y } = data;
      socket.to(roomId).emit("draw-move", { x, y });
    });

    // ending and saving strokes
    socket.on("draw-end", async (data) => {
      const { roomId, strokeData } = data;

      if (!strokeData) {
        console.error("Invalid stroke data received:", data);
        return;
      }

      try {
        // saving data
        const room = await Room.findOne({ roomId });
        if (room) {
          room.drawingData.push({
            type: "stroke",
            data: strokeData,
            timestamp: new Date(),
          });
          await room.save();
        }

        socket.to(roomId).emit("draw-end");
      } catch (error) {
        console.error("Error saving Stroke:", error);
      }
    });

    // clearCanvas
    //
    socket.on("clear-canvas", async (roomId) => {
      try {
        const room = await Room.findOne({ roomId });
        if (room) {
          room.drawingData.push({
            type: "clear",
            data: {},
            timestamp: new Date(),
          });
          room.drawingData = room.drawingData.filter(
            (cmd) =>
              cmd.timestamp.getTime() ===
              room.drawingData[room.drawingData.length - 1].timestamp.getTime(),
          );
          await room.save();
        }

        // broadcasting it to all users in room
        io.to(roomId).emit("clear-canvas");
      } catch (error) {
        console.error("Error clearing canvas", error);
      }
    });

    // leaving room
    //
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);

      const roomId = userRooms.get(socket.id);
      if (roomId) {
        handleUserLeaveRoom(socket.id, roomId, io);
      }
    });
  });

  // deleting old rooms every hour
  setInterval(
    async () => {
      try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const result = await Room.deleteMany({
          lastActivity: { $lt: oneDayAgo },
        });
        if (result.deletedCount > 0) {
          console.log(`Cleaned up ${result.deletedCount} old rooms`);
        }
      } catch (error) {
        console.error("Error cleaning up old rooms:", error);
      }
    },
    60 * 60 * 1000,
  );
};

const handleUserLeaveRoom = (userId, roomId, io) => {
  userRooms.delete(userId);

  if (roomUsers.has(roomId)) {
    roomUsers.get(roomId).delete(userId);

    const remainingUsers = roomUsers.get(roomId).size;

    if (remainingUsers === 0) {
      roomUsers.delete(roomId);
      activeRooms.delete(roomId);
      console.log(`Room ${roomId} is now empty and removed from active rooms`);
    } else {
      io.to(roomId).emit("user-count", remainingUsers);
      io.to(roomId).emit("user-left", userId);
      console.log(`Room ${roomId} now has ${remainingUsers} users`);
    }
  }
};

module.exports = { handleSocketConnection };
