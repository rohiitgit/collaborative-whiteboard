const express = require("express");
const Room = require("../models/Room");
const router = express.Router();

router.post("/join", async (req, res) => {
  try {
    const { roomId } = req.body;

    if (!roomId || roomId.length < 4 || roomId.length > 8) {
      return res.status(400).json({
        error: "Room ID must be between 4 and 8 characters",
      });
    }

    let room = await Room.findOne({ roomId });

    if (!room) {
      room = new Room({
        roomId,
        drawingData: [],
      });

      await room.save();
      console.log(`Created a new room: ${roomId}`);
    } else {
      room.lastActivity = new Date();
      await room.save();
      console.log(`Joined existing room: ${roomId}`);
    }

    res.json({
      roomId: room.roomId,
      createdAt: room.createdAt,
      drawingCount: room.drawingData.length,
    });
  } catch (error) {
    console.log("Error joining room: ", error);
    res.status(500).json({ error: "Failed to join the room" });
  }
});

router.get("/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ error: "Room not found " });
    }

    room.lastActivity = new Date();
    await room.save();

    res.json({
      roomId: room.roomId,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity,
      drawingData: room.drawingData,
    });
  } catch (error) {
    console.log("Error fetching room:", error);
    res.status(500).json({ error: "Failed to fetch room" });
  }
});

module.exports = router;
