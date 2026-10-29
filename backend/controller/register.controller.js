
const User = require("../models/user.model");
const bcrypt = require("bcrypt");

const registeruser = async (req, res) => {
  try {
    const { name, email, password ,confirmPassword } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
    }

    const userexist = await User.findOne({ email: cleanEmail });

    if (userexist) {
      return res.status(409).json({
        success: false,
        message: "You are already registered. Please login.",
      });
    }

    const hashpassword = await bcrypt.hash(password, 10);

    const newuser = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashpassword,
    });

    return res.status(201).json({
      success: true,
      message: "Registered successfully",
      user: {
        id: newuser._id,
        name: newuser.name,
        email: newuser.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    // Handle duplicate email if a unique index exists
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered. Please login.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = registeruser;
