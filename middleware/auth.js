import jwt from "jsonwebtoken";
import { User } from "../models/userSchema.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    console.log("Auth middleware called");
    
    // Get token from cookies
    const token = req.cookies.token;
    
    if (!token) {
      console.log("No token found in cookies");
      return res.status(401).json({
        success: false,
        message: "Please login first"
      });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    } catch (error) {
      console.log("Token verification failed:", error.message);
      
      // Clear the invalid cookie
      res.clearCookie("token");
      
      return res.status(401).json({
        success: false,
        message: "Session expired, please login again",
        tokenExpired: true
      });
    }
    
    console.log("Token decoded:", decoded);
    
    // Find user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.log("User not found");
      // Clear the cookie since it's invalid
      res.clearCookie("token");
      
      return res.status(401).json({
        success: false,
        message: "User not found",
        tokenExpired: true
      });
    }
    
    // Attach user to request
    req.user = user;
    console.log("Authentication successful for user:", user._id);
    
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    // Clear the cookie on any auth error
    res.clearCookie("token");
    
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      tokenExpired: true
    });
  }
};

// Middleware to check if user is admin
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }
};









