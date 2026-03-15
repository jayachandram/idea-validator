require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");

const connectDB = require("./config/database");
const { connectRedis } = require("./config/redis");
const { initializeFirebase } = require("./config/firebase");

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const userRoutes = require("./routes/user");

const app = express();

//
// ─── CONNECT SERVICES ───────────────────────────────────────
//

connectDB();
connectRedis();
initializeFirebase();

//
// ─── SECURITY MIDDLEWARE ────────────────────────────────────
//

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {

        defaultSrc: ["'self'"],

        scriptSrc: [
          "'self'",
          "'unsafe-eval'",
          "https://apis.google.com",
          "https://www.gstatic.com",
          "https://www.googleapis.com"
        ],

        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com"
        ],

        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com"
        ],

        imgSrc: [
          "'self'",
          "data:",
          "https://lh3.googleusercontent.com",
          "https://*.googleusercontent.com"
        ],

        frameSrc: [
          "'self'",
          "https://accounts.google.com",
          "https://*.firebaseapp.com"
        ],

        connectSrc: [
          "'self'",
          "https://identitytoolkit.googleapis.com",
          "https://securetoken.googleapis.com",
          "https://firestore.googleapis.com",
          "https://apis.google.com"
        ]

      }
    }
  })
);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      process.env.FRONTEND_URL
    ],
    credentials: true
  })
);

//
// ─── RATE LIMITERS ──────────────────────────────────────────
//

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many auth attempts. Try again later."
  }
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: "Too many chat requests. Slow down."
  }
});

//
// ─── GENERAL MIDDLEWARE ─────────────────────────────────────
//

app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

//
// ─── API ROUTES ─────────────────────────────────────────────
//

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/chat", chatLimiter, chatRoutes);
app.use("/api/user", userRoutes);

//
// ─── HEALTH CHECK ───────────────────────────────────────────
//

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    env: process.env.NODE_ENV,
    timestamp: new Date()
  });
});

//
// ─── SERVE REACT FRONTEND (PRODUCTION ONLY) ─────────────────
//

if (process.env.NODE_ENV === "production") {

  const buildPath = path.join(__dirname, "../frontend/build");

  app.use(express.static(buildPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });

}

//
// ─── GLOBAL ERROR HANDLER ───────────────────────────────────
//

app.use((err, req, res, next) => {

  console.error("Unhandled error:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors)
        .map(e => e.message)
        .join(". ")
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res
      .status(409)
      .json({ success: false, message: `${field} already exists.` });
  }

  if (err.name === "JsonWebTokenError") {
    return res
      .status(401)
      .json({ success: false, message: "Invalid token." });
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error."
        : err.message
  });

});

//
// ─── SERVER START ───────────────────────────────────────────
//

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log("\n🚀 Server running");
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Health: /api/health\n`);

});

module.exports = app;