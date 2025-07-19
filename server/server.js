const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const roomRoutes = require("./routes/rooms");
const { handleSocketConnection } = require("./socket/socketHandler");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.ORIGIN,
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGOOSE_URI);

mongoose.connection.on("connected", () => {
  console.log("CONNECTED TO MONGODB");
});

mongoose.connection.on("error", (err) => {
  console.error("MONGODB CONNECTION ERROR:", err);
});

app.use("/api/rooms", roomRoutes);

handleSocketConnection(io);

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
