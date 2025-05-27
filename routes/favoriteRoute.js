import express from "express";
import { 
  addToFavorites,
  removeFromFavorites,
  getUserFavorites
} from "../controllers/favoriteController.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

// Test route without authentication
router.get("/test-favorites", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Favorites route is working"
  });
});

// Routes that require authentication
router.get("/favorites", isAuthenticated, getUserFavorites);
router.post("/favorites/:productId", isAuthenticated, addToFavorites);
router.delete("/favorites/:productId", isAuthenticated, removeFromFavorites);

export default router;









