import { User } from "../models/userSchema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
// import dotenv from "dotenv";

export const Register = async (req, res) => {
    try {
        const {email, password } = req.body;
        // basic validation
        if ( !email || !password) {
            return res.status(401).json({
                message: "All fields are required.",
                success: false
            })
        }
        const user = await User.findOne({ email });
        if (user) {
            return res.status(401).json({
                message: "User already exist.",
                success: false
            })
        }
        const hashedPassword = await bcrypt.hash(password, 16);
         console.log("pass" , hashedPassword);
        await User.create({
           
            email,
            password: hashedPassword
        });
        return res.status(201).json({
            message: "Account created successfully.",
            success: true
        })

    } catch (error) {
        console.log(error);
    }
}
export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log("Login attempt with:", { email });
    
    if (!email || !password) {
      return res.status(401).json({
        message: "All fields are required.",
        success: false
      });
    }
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log("User not found:", email);
      return res.status(401).json({
        message: "Incorrect email or password",
        success: false
      });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log("Password mismatch for:", email);
      return res.status(401).json({
        message: "Incorrect email or password",
        success: false
      });
    }
    
    const tokenData = {
      userId: user._id
    };
    
    const token = await jwt.sign(tokenData, process.env.TOKEN_SECRET, { expiresIn: "1d" });
    
    console.log("Login successful for:", email);
    console.log("Token generated:", token.substring(0, 20) + "...");
    
    // Remove password from user object before sending response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    return res.status(200)
      .cookie("token", token, { 
         httpOnly: true,       // ✅ Protects against XSS
  secure: true,         // ✅ Required for HTTPS (mobile browsers enforce this)
  sameSite: 'None',     // ✅ Allows cross-site cookies (frontend ≠ backend)
  maxAge: 24 * 60 * 60 * 1000  // ✅ 1 day expiration
        // expires: new Date(Date.now() + 24 * 60 * 60 * 1000), 
        // httpOnly: true,
        // sameSite: 'None',
        // // sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
        // secure: process.env.NODE_ENV === 'production'
      })
      .json({
        message: `Welcome back ${user.name || 'User'}`,
        user: userResponse,
        success: true
      });
      
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "An error occurred during login",
      success: false,
      error: error.message
    });
  }
}
export const Logout = (req, res) => {
    return res.cookie("token", "", { expiresIn: new Date(Date.now()) }).json({
        message: "user logged out successfully.",
        success: true
    })
}

// Check authentication status
export const checkAuth = async (req, res) => {
  try {
    // Since this route uses the isAuthenticated middleware,
    // if execution reaches here, the user is authenticated
    // and req.user contains the user data
    
    return res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error("Check auth error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check authentication status",
      error: error.message
    });
  }
};

// Google login controller
export const googleLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "Access token is required"
      });
    }
    
    // Get user info from Google
    const googleUserInfo = await axios.get(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    
    const { email, name, sub: googleId, picture } = googleUserInfo.data;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email not provided by Google"
      });
    }
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user if not exists
      // Generate a random password for the user
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        googleId,
        avatar: picture || "",
        role: "user",
        favorites: []
      });
    } else {
      // Update existing user with Google info if needed
      user.googleId = googleId;
      user.avatar = picture || user.avatar;
      await user.save();
    }
    
    // Create JWT token
    const tokenData = {
      userId: user._id
    };
    
    const token = await jwt.sign(tokenData, process.env.TOKEN_SECRET, { expiresIn: "1d" });
    console.log("Google login successful for:", email);
    console.log("Token generated:", token.substring(0, 20) + "...");
    
    // Send response with cookie
    return res.status(200)
      .cookie("token", token, { 
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), 
        httpOnly: true,
        sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
        secure: process.env.NODE_ENV === 'production'
      })
      .json({
        success: true,
        message: `Welcome ${user.name}`,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        }
      });
    
  } catch (error) {
    console.error("Google login error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred during Google login",
      error: error.message
    });
  }
};

