require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const vegetableRoutes = require("./routes/vegetableRoutes");
const orderRoutes = require("./routes/orderRoutes");
const farmerRoutes = require("./routes/farmerRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();
app.set("trust proxy", 1);

// ---------------- DB ----------------
connectDB();

// ---------------- CORS (FINAL FIX) ----------------
const defaultAllowedOrigins = [
  "http://localhost:5173",
  "https://krushisetu.vercel.app",
  process.env.FRONTEND_URL
].filter(Boolean);

const envAllowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients and same-origin calls
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow Vercel preview deployments
    if (/^https:\/\/.*\.vercel\.app$/i.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));
app.options("/{*splat}", cors(corsOptions)); // Express 5-compatible preflight wildcard

// ---------------- Middleware ----------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("combined"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// ---------------- Routes ----------------
app.get("/", (req, res) => {
  res.json({ message: "KrushiSetu API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/farmers", farmerRoutes);
app.use("/api/vegetables", vegetableRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);

// ---------------- Error Handling ----------------
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

// ---------------- Server ----------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
