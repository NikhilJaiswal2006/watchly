
const crypto = require("crypto");
const mongoose = require("mongoose");
const Room = require("../models/room.model");

// CREATE ROOM
const createRoom = async (req, res) => {
  try {

    
    const { name } = req.body;
    const userId = req.user.userid;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Room name is required",
      });
    }

    const roomId = crypto.randomBytes(4).toString("hex").toUpperCase();

    const room = await Room.create({
      roomId,
      name: name.trim(),
      hostId: userId,
      participants: [
        {
          userId,
          role: "HOST",
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      room,
    });
  } catch (error) {
    console.error("Create room error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create room",
    });
  }
};

// JOIN ROOM
const joinRoom = async (req, res) => {
  try {
    const { roomCode } = req.body;
    const userId = req.user.userid;

    if (typeof roomCode !== "string" || !roomCode.trim()) {
      return res.status(400).json({
        success: false,
        message: "Room code is required",
      });
    }

    const room = await Room.findOne({
      roomId: roomCode.trim().toUpperCase(),
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const alreadyJoined = room.participants.some(
      (participant) => participant.userId.toString() === userId
    );

    if (alreadyJoined) {
      return res.status(200).json({
        success: true,
        message: "You are already a member of this room",
        room,
      });
    }

    room.participants.push({
      userId,
      role: "PARTICIPANT",
    });

    await room.save();

    return res.status(200).json({
      success: true,
      message: "Joined room successfully",
      room,
    });
  } catch (error) {
    console.error("Join room error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to join room",
    });
  }
};

// GET MY ROOMS
const getMyRooms = async (req, res) => {
  try {
    const userId = req.user.userid;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid user authentication",
      });
    }

    const rooms = await Room.find({
      "participants.userId": userId,
    }).sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    console.error("Get rooms error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch rooms",
    });
  }
};

// get room detailes
// GET ROOM DETAILS
const getRoomDetails = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const userId = req.user.userid;

    const room = await Room.findOne({
      roomId: roomCode.trim().toUpperCase(),
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const isMember = room.participants.some(
      (participant) => participant.userId.toString() === userId
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this room",
      });
    }

    return res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    console.error("Get room details error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch room details",
    });
  }
};


const updateRoomVideo = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { youtubeUrl } = req.body;

  

    // Validate the YouTube URL
    if (!youtubeUrl || typeof youtubeUrl !== "string") {
      return res.status(400).json({
        success: false,
        message: "Please provide a YouTube URL.",
      });
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(youtubeUrl.trim());
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid YouTube URL.",
      });
    }

    const allowedHosts = [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "youtu.be",
      "www.youtube-nocookie.com",
    ];

    if (
      !["https:", "http:"].includes(parsedUrl.protocol) ||
      !allowedHosts.includes(parsedUrl.hostname)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid YouTube URL.",
      });
    }

    let videoId = "";

    if (parsedUrl.hostname === "youtu.be") {
      videoId = parsedUrl.pathname.split("/").filter(Boolean)[0] || "";
    } else {
      const parts = parsedUrl.pathname.split("/").filter(Boolean);

      if (parts[0] === "watch") {
        videoId = parsedUrl.searchParams.get("v") || "";
      } else if (["embed", "shorts", "live"].includes(parts[0])) {
        videoId = parts[1] || "";
      }
    }

    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return res.status(400).json({
        success: false,
        message: "Could not find a valid YouTube video ID.",
      });
    }

    // Find the room
    const room = await Room.findOne({ roomId: roomCode });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found.",
      });
    }

    // Only the host can change the video
   const userId =
  req.user?.userid ||
  req.user?.id ||
  req.user?.userId ||
  req.user?._id;

console.log("Authenticated user:", req.user);
console.log("Extracted user ID:", userId);
console.log("Database host ID:", String(room.hostId));

if (!userId || String(room.hostId) !== String(userId)) {
  return res.status(403).json({
    success: false,
    message: "Only the host can change the video.",
  });
}

    // Save the video ID in MongoDB
    room.videoId = videoId;
    room.currentTime = 0;
    room.isPlaying = false;

    await room.save();

    return res.status(200).json({
      success: true,
      message: "YouTube video added successfully.",
      room,
    });
  } catch (error) {
    console.error("Update room video error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update the room video.",
    });
  }
};


module.exports = {
  createRoom,
  joinRoom,
  getMyRooms,
  getRoomDetails,
  updateRoomVideo
};
