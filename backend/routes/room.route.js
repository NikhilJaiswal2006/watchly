
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/Auth.middleware");

const {
  createRoom,
  joinRoom,
  getMyRooms,
  getRoomDetails,
  updateRoomVideo
} = require("../controller/room.controller");

router.post("/", authMiddleware, createRoom);
router.post("/join", authMiddleware, joinRoom);
router.get("/my-rooms", authMiddleware, getMyRooms);
router.get("/:roomCode", authMiddleware, getRoomDetails);
router.put("/:roomCode/video", authMiddleware, updateRoomVideo);

module.exports = router;
