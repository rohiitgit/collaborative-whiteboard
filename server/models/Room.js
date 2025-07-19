const mongoose = require("mongoose");

const drawingSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["stroke", "clear"],
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  drawingData: [drawingSchema],
});

roomSchema.index({ lastActivity: 1 });

roomSchema.pre("save", function (next) {
  this.lastActivity = new Date();
  next();
});

module.exports = mongoose.model("Room", roomSchema);
