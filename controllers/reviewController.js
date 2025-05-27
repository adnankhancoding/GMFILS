import { Review } from "../models/reviewSchema.js";
import { Product } from "../models/productSchema.js";
import mongoose from "mongoose";

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { product, rating, comment } = req.body;
    const user = req.user._id; // Assuming you have authentication middleware

    // Check if product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({ user, product });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product"
      });
    }

    // Create new review
    const review = await Review.create({
      product,
      user,
      rating,
      comment
    });

    // Update product rating
    await updateProductRating(product);

    return res.status(201).json({
      success: true,
      message: "Review added successfully",
      review
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create review",
      error: error.message
    });
  }
};

// Get all reviews for a product
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message
    });
  }
};

// Update a review
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const user = req.user._id; // Assuming you have authentication middleware

    // Find review
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    // Check if user owns the review
    if (review.user.toString() !== user.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own reviews"
      });
    }

    // Update review
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();

    // Update product rating
    await updateProductRating(review.product);

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review
    });
  } catch (error) {
    console.error("Error updating review:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: error.message
    });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user._id; // Assuming you have authentication middleware

    // Find review
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    // Check if user owns the review
    if (review.user.toString() !== user.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own reviews"
      });
    }

    const productId = review.product;

    // Delete review
    await Review.findByIdAndDelete(id);

    // Update product rating
    await updateProductRating(productId);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error.message
    });
  }
};

// Helper function to update product rating
const updateProductRating = async (productId) => {
  const reviews = await Review.find({ product: productId });
  
  if (reviews.length === 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: 0,
      reviewsCount: 0
    });
    return;
  }
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  await Product.findByIdAndUpdate(productId, {
    rating: averageRating,
    reviewsCount: reviews.length
  });
};