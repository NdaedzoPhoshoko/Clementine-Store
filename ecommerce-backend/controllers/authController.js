import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pool from "../config/db.js";

const signAccessToken = (id, tokenVersion = 0) => {
  return jwt.sign({ id, tv: tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "30m",
  });
};

const signRefreshToken = (id, tokenVersion = 0) => {
  return jwt.sign({ id, tv: tokenVersion }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const userId = payload.id;
    const tokenVersion = payload.tv || 0;

    const result = await pool.query("SELECT token_version FROM users WHERE id=$1", [userId]);
    if (result.rows.length === 0) return res.status(404).json({ message: "User not found" });
    const currentVersion = result.rows[0].token_version || 0;
    if (currentVersion !== tokenVersion) {
      return res.status(401).json({ message: "Refresh token revoked" });
    }

    const newAccess = signAccessToken(userId, currentVersion);
    const newRefresh = signRefreshToken(userId, currentVersion);
    res.cookie("refreshToken", newRefresh, refreshCookieOptions);
    return res.status(200).json({ accessToken: newAccess });
  } catch (err) {
    console.error("Refresh error:", err.message);
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

export const logout = async (req, res) => {
  try {
    let userId = req.user?.id;
    if (!userId) {
      const token = req.cookies?.refreshToken;
      if (token) {
        try {
          const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
          userId = payload.id;
        } catch (_) {}
      }
    }

    if (userId) {
      await pool.query("UPDATE users SET token_version = token_version + 1 WHERE id=$1", [userId]);
    }

    res.clearCookie("refreshToken", { ...refreshCookieOptions, maxAge: 0 });
    return res.status(200).json({ message: "Logged out" });
  } catch (err) {
    console.error("Logout error:", err.message);
    return res.status(500).json({ message: "Error logging out" });
  }
};

export const setLoginCookiesAndTokens = (res, userId, tokenVersion = 0) => {
  const accessToken = signAccessToken(userId, tokenVersion);
  const refreshToken = signRefreshToken(userId, tokenVersion);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  return { accessToken, refreshToken };
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    const result = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Email not found" });

    const userId = result.rows[0].id;
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      "UPDATE users SET reset_otp_hash=$1, reset_otp_expires=$2 WHERE id=$3",
      [otpHash, expiresAt, userId]
    );

    // Return OTP details to the frontend for EmailJS delivery
    return res.status(200).json({
      message: "OTP generated",
      passcode: otp,
      time: expiresAt.toLocaleString(),
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    return res.status(500).json({ message: "Error initiating password reset" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password, confirmPassword } = req.body;
    if (!email || !otp || !password || !confirmPassword) {
      return res.status(400).json({ message: "Email, OTP, password and confirmPassword are required" });
    }
    if (password !== confirmPassword) return res.status(400).json({ message: "Passwords do not match" });

    const result = await pool.query(
      "SELECT id, reset_otp_hash, reset_otp_expires FROM users WHERE email=$1",
      [email]
    );
    if (result.rows.length === 0) return res.status(400).json({ message: "Invalid or expired OTP" });
    const user = result.rows[0];
    if (!user.reset_otp_hash || !user.reset_otp_expires) return res.status(400).json({ message: "Invalid or expired OTP" });
    if (new Date(user.reset_otp_expires).getTime() < Date.now()) return res.status(400).json({ message: "OTP expired" });

    const isValid = await bcrypt.compare(otp, user.reset_otp_hash);
    if (!isValid) return res.status(400).json({ message: "Invalid OTP" });

    const newHash = await bcrypt.hash(password, 10);
    await pool.query(
      "UPDATE users SET password_hash=$1, reset_otp_hash=NULL, reset_otp_expires=NULL, token_version = token_version + 1 WHERE id=$2",
      [newHash, user.id]
    );

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err.message);
    return res.status(500).json({ message: "Error resetting password" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!userId) return res.status(401).json({ message: "Not authorized" });
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Old password, new password and confirmPassword are required" });
    }
    if (newPassword !== confirmPassword) return res.status(400).json({ message: "Passwords do not match" });

    const result = await pool.query("SELECT password_hash FROM users WHERE id=$1", [userId]);
    if (result.rows.length === 0) return res.status(404).json({ message: "User not found" });
    const isMatch = await bcrypt.compare(oldPassword, result.rows[0].password_hash);
    if (!isMatch) return res.status(401).json({ message: "Old password is incorrect" });

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password_hash=$1, token_version = token_version + 1 WHERE id=$2",
      [newHash, userId]
    );

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err.message);
    return res.status(500).json({ message: "Error changing password" });
  }
};