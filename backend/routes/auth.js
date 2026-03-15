const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");

const User = require("../models/User");
const { protect, sendTokenResponse, generateTokens } = require("../middleware/auth");
const { sendEmail } = require("../services/emailService");
const { verifyFirebaseToken } = require("../config/firebase");

// ---------------- Rate limiter ----------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many authentication attempts. Try again later."
  }
});

// ---------------- Validation helper ----------------
function handleValidation(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array()
    });
    return false;
  }

  return true;
}

//
// ============================================================
// REGISTER
// ============================================================
//

router.post(
  "/register",
  authLimiter,
  [
    body("name").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  ],
  async (req, res, next) => {

    try {

      if (!handleValidation(req, res)) return;

      const { name, email, password } = req.body;

      const existing = await User.findOne({ email });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Email already registered"
        });
      }

      const verifyToken = crypto.randomBytes(32).toString("hex");

      const hashedToken = crypto
        .createHash("sha256")
        .update(verifyToken)
        .digest("hex");

      const user = await User.create({
        name,
        email,
        password,
        emailVerified: false,
        providers: [{ type: "email" }],
        emailVerifyToken: hashedToken,
        emailVerifyExpires: Date.now() + 24 * 60 * 60 * 1000
      });

      const verifyUrl =
        "http://localhost:5000/api/auth/verify-email?token=" +
        verifyToken;

      await sendEmail(email, "verify", name, verifyUrl);

      res.status(201).json({
        success: true,
        message: "Account created. Please verify your email.",
        userId: user._id
      });

    } catch (err) {
      next(err);
    }

  }
);

//
// ============================================================
// VERIFY EMAIL
// ============================================================
//

router.get("/verify-email", async (req, res, next) => {

  try {

    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification link"
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      emailVerifyToken: hashedToken,
      emailVerifyExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Verification token invalid or expired"
      });
    }

    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;

    await user.save();

    res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);

  } catch (err) {
    next(err);
  }

});

//
// ============================================================
// LOGIN
// ============================================================
//

router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty()
  ],
  async (req, res, next) => {

    try {

      if (!handleValidation(req, res)) return;

      const { email, password } = req.body;

      const user = await User.findOne({ email }).select("+password");

      if (!user || !user.password) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials"
        });
      }

      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials"
        });
      }

      if (!user.emailVerified) {
        return res.status(403).json({
          success: false,
          message: "Please verify your email"
        });
      }

      sendTokenResponse(user, 200, res);

    } catch (err) {
      next(err);
    }

  }
);

//
// ============================================================
// GOOGLE LOGIN
// ============================================================
//

router.post("/google", async (req, res, next) => {

  try {

    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "idToken required"
      });
    }

    const decoded = await verifyFirebaseToken(idToken);

    const { uid, email, name, picture } = decoded;

    let user = await User.findOne({
      $or: [{ firebaseUid: uid }, { email }]
    });

    if (!user) {

      user = await User.create({
        name: name || "User",
        email,
        avatar: picture,
        firebaseUid: uid,
        emailVerified: true,
        providers: [{ type: "google", providerId: uid }]
      });

    }

    sendTokenResponse(user, 200, res);

  } catch (err) {
    next(err);
  }

});

//
// ============================================================
// CURRENT USER
// ============================================================
//

router.get("/me", protect, (req, res) => {

  res.json({
    success: true,
    user: req.user
  });

});

//
// ============================================================
// REFRESH TOKEN
// ============================================================
//

router.post("/refresh", async (req, res, next) => {

  try {

    const jwt = require("jsonwebtoken");

    const refreshToken =
      req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "No refresh token"
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    const { accessToken } = generateTokens(user._id);

    res.json({
      success: true,
      accessToken
    });

  } catch (err) {
    next(err);
  }

});

//
// ============================================================
// LOGOUT
// ============================================================
//

router.post("/logout", protect, (req, res) => {

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.json({
    success: true,
    message: "Logged out"
  });

});

module.exports = router;