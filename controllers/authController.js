const User = require("../models/User");
const DeliveryBoy = require("../models/DeliveryBoy");
const Hub = require("../models/Hub");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const generateToken = require("../utils/generateToken");

exports.registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const { name, email, phone, password, role, city, village, latitude, longitude, coordinates, deliveryType } = req.body;
    const fallbackCoordinates = [73.8567, 18.5204];
    const safeCoordinates =
      Array.isArray(coordinates) &&
      coordinates.length === 2 &&
      coordinates.every((value) => Number.isFinite(Number(value)))
        ? [Number(coordinates[0]), Number(coordinates[1])]
        : fallbackCoordinates;

    if (!phone) {
      return res.status(400).json({ message: "Please provide a phone number." });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "This email is already registered." });
    }

    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({ message: "This phone number is already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedRole = role.toLowerCase();
    const normalizedDeliveryType = deliveryType === "delivery" ? "delivery" : "pickup";

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: normalizedRole,
      city,
      village,
      latitude: Number(latitude) || safeCoordinates[1],
      longitude: Number(longitude) || safeCoordinates[0]
    });

    if (normalizedRole === "delivery_boy") {
      await DeliveryBoy.create({
        user: user._id,
        name: user.name,
        phone: user.phone,
        type: normalizedDeliveryType,
        isAvailable: true,
        location: {
          type: "Point",
          coordinates: safeCoordinates
        }
      });
    }

    if (normalizedRole === "hub_manager") {
      await Hub.create({
        manager: user._id,
        hubName: `${user.name}'s Center`,
        name: `${user.name}'s Center`,
        location: {
          type: "Point",
          coordinates: safeCoordinates
        }
      });
    }

    res.status(201).json({
      message: "User registered successfully",
      token: generateToken(user._id, normalizedRole),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    res.status(200).json({
      message: "Login successful",
      token: generateToken(user._id, user.role),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, city, village } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (city) updateData.city = city;
    if (village) updateData.village = village;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        city: user.city,
        village: user.village
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
