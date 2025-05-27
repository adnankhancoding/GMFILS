import { User } from "../models/userSchema.js";
import { Product } from "../models/productSchema.js";

export const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("Fetching favorites for user:", userId);
    
    // Find user and populate favorites
    const user = await User.findById(userId).populate({
      path: 'favorites',
      model: 'Product'
    });
    
    if (!user) {
      console.log("User not found:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    console.log("User favorites found:", user.favorites ? user.favorites.length : 0);
    
    return res.status(200).json({
      success: true,
      favorites: user.favorites || []
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch favorites",
      error: error.message
    });
  }
};

export const addToFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const productId = req.params.productId;
    
    console.log(`Adding product ${productId} to favorites for user ${userId}`);
    
    // Validate productId
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format"
      });
    }
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    
    // Add to favorites if not already added
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Convert favorites to strings for comparison
    const favoriteIds = user.favorites.map(id => id.toString());
    
    if (favoriteIds.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: "Product already in favorites"
      });
    }
    
    user.favorites.push(productId);
    await user.save();
    
    console.log(`Product ${productId} added to favorites successfully`);
    
    return res.status(200).json({
      success: true,
      message: "Product added to favorites"
    });
  } catch (error) {
    console.error("Error adding to favorites:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add to favorites",
      error: error.message
    });
  }
};

export const removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const productId = req.params.productId;
    
    console.log(`Removing product ${productId} from favorites for user ${userId}`);
    
    // Validate productId
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format"
      });
    }
    
    // Remove from favorites
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Convert favorites to strings for comparison
    const favoriteIds = user.favorites.map(id => id.toString());
    
    if (!favoriteIds.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: "Product not in favorites"
      });
    }
    
    user.favorites = user.favorites.filter(id => id.toString() !== productId);
    await user.save();
    
    console.log(`Product ${productId} removed from favorites successfully`);
    
    return res.status(200).json({
      success: true,
      message: "Product removed from favorites"
    });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove from favorites",
      error: error.message
    });
  }
};







