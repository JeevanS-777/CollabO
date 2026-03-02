import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

export const protectRoute = async (req, res, next) => {
  try {
    // try normal cookie
    let token = req.cookies?.jwt;

    // fallback for cross-site cookies (VERY IMPORTANT FOR VERCEL + RENDER)
    if (!token && req.headers.cookie) {
      const rawCookie = req.headers.cookie
        .split(";")
        .find((c) => c.trim().startsWith("jwt="));

      if (rawCookie) {
        token = rawCookie.split("=")[1];
      }
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    console.log("Error in protectRoute middleware:", error);
    res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
};