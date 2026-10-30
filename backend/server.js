const express = require("express");
const jwt = require("jsonwebtoken");
const Room = require("./models/room.model");
const User = require("./models/user.model");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");

const Authmiddleware = require("./middleware/Auth.middleware");


dotenv.config({ path: ".env" });

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(cors());

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*", // Development only
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});


io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token || !process.env.JWT_SECRET) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId =
      decoded.userid ||
      decoded.userId ||
      decoded.id ||
      decoded._id ||
      decoded.sub;

    if (!userId) {
      return next(new Error("Invalid token payload"));
    }

    const user = await User.findById(userId).select("name");

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.data.userId = String(user._id);
    socket.data.username = user.name;

    next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);
    next(new Error("Authentication failed"));
  }
});



// MongoDB configuration
const port = process.env.PORT || 3000;
const mongoURL = process.env.MONGO_URL;

// Existing routes
const registeruser = require("./routes/register.route");
const loginuser = require("./routes/login.route");
const roomRoutes = require("./routes/room.route");

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(mongoURL);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Database connection error:", error.message);
    process.exit(1);
  }
};

connectDB();

// API routes — preserved
app.use("/api/users", registeruser);
app.use("/api/users", loginuser);
app.use("/api/rooms", roomRoutes);

app.get("/", (req, res) => {
  res.send("Watchly backend is running");
});

app.get("/api/profile", Authmiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to your secure profile page!",
    your_backend_extracted_data: req.user,
  });
});

// Socket.IO connection test

io.on("connection", (socket) => {
  console.log(
    "Authenticated socket connected:",
    socket.id,
    "User:",
    socket.data.userId
  );

socket.on("room:playback", (payload = {}) => {
  const roomCode = String(payload.roomCode || "").trim();

  if (!roomCode || socket.data.roomCode !== roomCode) {
    return;
  }

  socket.to(roomCode).emit("room:playback", {
    state: payload.state,
    time: Number(payload.time) || 0,
  });
});


  // Join a room after verifying membership
  socket.on("room:join", async (payload = {}, callback) => {
    const ack = typeof callback === "function" ? callback : () => {};

    try {
      const roomCode = String(payload.roomCode || "").trim();

      if (!roomCode) {
        return ack({ success: false, message: "Room code is required" });
      }

      const room = await Room.findOne({ roomId: roomCode });

      if (!room) {
        return ack({ success: false, message: "Room not found" });
      }

      const userId = socket.data.userId;
      const isHost = String(room.hostId) === userId;
      const isParticipant = room.participants.some(
        (p) => String(p.userId) === userId
      );

      if (!isHost && !isParticipant) {
        return ack({
          success: false,
          message: "You are not a participant in this room",
        });
      }

      // Leave previous room, if any
      if (socket.data.roomCode) {
        socket.leave(socket.data.roomCode);
      }

      socket.join(roomCode);
      socket.data.roomCode = roomCode;

      console.log(`${userId} joined room chat: ${roomCode}`);

      return ack({ success: true, roomCode });
    } catch (error) {
      console.error("Room join error:", error.message);
      return ack({ success: false, message: "Unable to join room chat" });
    }
  });

  // Send a message to the current room
  socket.on("room:chat:send", async (payload = {}, callback) => {
    const ack = typeof callback === "function" ? callback : () => {};

    try {
      const roomCode = String(payload.roomCode || "").trim();
      const messageText = String(payload.text || "").trim();

      if (!roomCode || socket.data.roomCode !== roomCode) {
        return ack({ success: false, message: "Join the room first" });
      }

      if (!messageText || messageText.length > 1000) {
        return ack({
          success: false,
          message: "Message must contain 1–1000 characters",
        });
      }

      const room = await Room.findOne({ roomId: roomCode }).select(
        "hostId participants"
      );

      if (!room) {
        return ack({ success: false, message: "Room not found" });
      }

      const userId = socket.data.userId;
      const isHost = String(room.hostId) === userId;
      const isParticipant = room.participants.some(
        (p) => String(p.userId) === userId
      );

      if (!isHost && !isParticipant) {
        socket.leave(roomCode);
        socket.data.roomCode = null;

        return ack({ success: false, message: "Room access denied" });
      }

      const message = {
        id: `${Date.now()}-${socket.id}`,
        userId,
        name: socket.data.username,
        text: messageText,
        time: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      io.to(roomCode).emit("room:chat:message", message);

      return ack({ success: true });
    } catch (error) {
      console.error("Chat send error:", error.message);
      return ack({ success: false, message: "Unable to send message" });
    }
  });

  
  // Host-only room announcements
  socket.on("room:announcement:send", async (payload = {}, callback) => {
    const ack = typeof callback === "function" ? callback : () => {};

    try {
      const roomCode = String(payload.roomCode || "").trim();
      const announcementText = String(payload.text || "").trim();

      // Verify that the socket has joined this room
      if (!roomCode || socket.data.roomCode !== roomCode) {
        return ack({
          success: false,
          message: "Join the room first",
        });
      }

      // Validate announcement
      if (!announcementText || announcementText.length > 500) {
        return ack({
          success: false,
          message: "Announcement must contain 1–500 characters",
        });
      }

      // Fetch the actual room and verify its host
      const room = await Room.findOne({ roomId: roomCode }).select(
        "hostId participants"
      );

      if (!room) {
        return ack({ success: false, message: "Room not found" });
      }

      const userId = socket.data.userId;
      const isHost = String(room.hostId) === userId;

      if (!isHost) {
        return ack({
          success: false,
          message: "Only the room host can send announcements",
        });
      }

      const announcement = {
        id: `${Date.now()}-${socket.id}`,
        roomCode,
        userId,
        name: socket.data.username,
        text: announcementText,
        time: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      // Broadcast to everyone currently in the room
      io.to(roomCode).emit("room:announcement", announcement);

      return ack({ success: true });
    } catch (error) {
      console.error("Announcement error:", error.message);

      return ack({
        success: false,
        message: "Unable to send announcement",
      });
    }
  });



  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});


// Start HTTP + Socket.IO server
server.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
  console.log("Socket.IO is ready");
});