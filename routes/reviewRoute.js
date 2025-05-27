import express from "express";
import { 
  createReview, 
  getProductReviews, 
  updateReview, 
  deleteReview 
} from "../controllers/reviewController.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

// Create a new review (requires authentication)
router.post("/reviews", isAuthenticated, createReview);

// Get all reviews for a product (no authentication required)
router.get("/products/:productId/reviews", getProductReviews);

// Update a review (requires authentication)
router.put("/reviews/:id", isAuthenticated, updateReview);

// Delete a review (requires authentication)
router.delete("/reviews/:id", isAuthenticated, deleteReview);

export default router;
