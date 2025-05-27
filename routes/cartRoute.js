import express from "express";
import { 
  getUserCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart 
} from "../controllers/cartController.js";
import { isAuthenticated } from "../middleware/auth.js"; // Assuming you have auth middleware

const router = express.Router();

// All cart routes require authentication
router.use(isAuthenticated);

// Get user's cart
router.get("/cart", getUserCart);

// Add item to cart
router.post("/cart", addToCart);

// Update cart item quantity
router.put("/cart", updateCartItem);

// Remove item from cart
router.delete("/cart/:itemId", removeFromCart);

// Clear cart
router.delete("/cart", clearCart);

export default router;