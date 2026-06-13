import crypto from "crypto";
import { User } from "../models/User.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/generateToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import { env } from "../config/env.js";
import { emitEvent } from "../config/socket.js";

function generateOtp() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function safeUser(user) {
  if (!user) return user;
  const { password, refreshTokenHash, ...safe } = user;
  return safe;
}

function tokenResponse(user, accessToken, refreshToken) {
  return {
    user: safeUser(user),
    accessToken,
    refreshToken,
  };
}

export async function register(req, res, next) {
  try {
    const { fullName, email, password, phone, college, department, graduationYear } = req.body;
    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ message: "fullName, email and password are required" });
    }
    const pwd = String(password).trim();
    if (pwd.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const otp = generateOtp();
    const payload = { sub: "temp", role: "student" };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password: pwd,
      phone,
      college,
      department,
      graduationYear,
      isEmailVerified: env.nodeEnv === "development",
      emailOtp: otp,
      emailOtpExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      refreshTokenHash: hashToken(refreshToken),
      lastActiveAt: new Date(),
    });
    await sendEmail({
      to: user.email,
      subject: "Verify your email",
      text: `Your verification code is ${otp}. It expires in 15 minutes.`,
    }).catch(() => {});

    // Update payload with real user id
    const realPayload = { sub: user._id || user.id, role: user.role };
    const realAccessToken = signAccessToken(realPayload);
    const realRefreshToken = signRefreshToken(realPayload);
    await User.findByIdAndUpdate(user._id || user.id, {
      refreshTokenHash: hashToken(realRefreshToken),
      lastActiveAt: new Date(),
    });

    emitEvent("user_registered", { userId: user._id || user.id, email: user.email });
    res.status(201).json({
      message: "Account created. You're signed in.",
      ...tokenResponse(user, realAccessToken, realRefreshToken),
      devOtp: process.env.NODE_ENV === "production" ? undefined : otp,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "email and otp are required" });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isEmailVerified) {
      return res.json({ message: "Email already verified" });
    }
    if (!user.emailOtp || !user.emailOtpExpiresAt) {
      return res.status(400).json({ message: "No OTP requested" });
    }
    if (new Date(user.emailOtpExpiresAt) < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }
    if (user.emailOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    await User.findByIdAndUpdate(user._id || user.id, {
      isEmailVerified: true,
      emailOtp: null,
      emailOtpExpiresAt: null,
    });
    res.json({ message: "Email verified" });
  } catch (err) {
    next(err);
  }
}

export async function resendOtp(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isEmailVerified) {
      return res.json({ message: "Email already verified" });
    }
    const otp = generateOtp();
    await User.findByIdAndUpdate(user._id || user.id, {
      emailOtp: otp,
      emailOtpExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
    await sendEmail({
      to: user.email,
      subject: "Your new verification code",
      text: `Your verification code is ${otp}.`,
    });
    res.json({
      message: "OTP resent",
      devOtp: process.env.NODE_ENV === "production" ? undefined : otp,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        message: "No account found with this email. Please register first.",
        code: "USER_NOT_FOUND",
      });
    }
    const ok = await User.comparePassword(String(password).trim(), user.password);
    if (!ok) {
      return res.status(401).json({
        message: "Incorrect password. Please try again or use Forgot Password.",
        code: "INVALID_PASSWORD",
      });
    }
    const payload = { sub: user._id || user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await User.findByIdAndUpdate(user._id || user.id, {
      refreshTokenHash: hashToken(refreshToken),
      lastActiveAt: new Date(),
    });
    res.json(tokenResponse(user, accessToken, refreshToken));
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "refreshToken is required" });
    }
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub);
    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    if (user.refreshTokenHash !== hashToken(refreshToken)) {
      return res.status(401).json({ message: "Refresh token revoked" });
    }
    const newPayload = { sub: user._id || user.id, role: user.role };
    const accessToken = signAccessToken(newPayload);
    const newRefresh = signRefreshToken(newPayload);
    await User.findByIdAndUpdate(user._id || user.id, {
      refreshTokenHash: hashToken(newRefresh),
      lastActiveAt: new Date(),
    });
    res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
}

export async function logout(req, res, next) {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id || req.user.id, {
        refreshTokenHash: null,
      });
    }
    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    res.json({ user: safeUser(req.user) });
  } catch (err) {
    next(err);
  }
}

export async function ping(req, res, next) {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id || req.user.id, {
        lastActiveAt: new Date(),
      });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json({ message: "If the email exists, a reset link was sent" });
    const token = crypto.randomBytes(32).toString("hex");
    await User.findByIdAndUpdate(user._id || user.id, {
      emailOtp: token,
      emailOtpExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      text: `Reset your password using this link (valid 30 min): ${link}`,
    });
    res.json({ message: "If the email exists, a reset link was sent" });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: "email, token and newPassword are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.emailOtp || !user.emailOtpExpiresAt) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    if (user.emailOtp !== token || new Date(user.emailOtpExpiresAt) < new Date()) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    await User.findByIdAndUpdate(user._id || user.id, {
      password: newPassword,
      emailOtp: null,
      emailOtpExpiresAt: null,
      refreshTokenHash: null,
    });
    res.json({ message: "Password updated" });
  } catch (err) {
    next(err);
  }
}
