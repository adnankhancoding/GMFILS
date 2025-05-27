import { Cart } from "../models/cartSchema.js";
import { Product } from "../models/productSchema.js";

// Get user cart
export const getUserCart = async (req, res) => {
  try {
    const userId = req.user._id;

    let cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.product',
        select: 'name price images stock'
      });

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    return res.status(200).json({
      success: true,
      cart
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: error.message
    });
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id;

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Not enough stock available"
      });
    }

    // Find user's cart
    let cart = await Cart.findOne({ user: userId });

    // If cart doesn't exist, create one
    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [{ product: productId, quantity }]
      });
    } else {
      // Check if product already in cart
      const itemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        // Product exists in cart, update quantity
        const newQuantity = cart.items[itemIndex].quantity + quantity;
        
        // Check if new quantity exceeds stock
        if (newQuantity > product.stock) {
          return res.status(400).json({
            success: false,
            message: "Cannot add more of this item (stock limit)"
          });
        }
        
        cart.items[itemIndex].quantity = newQuantity;
      } else {
        // Product not in cart, add new item
        cart.items.push({ product: productId, quantity });
      }

      await cart.save();
    }

    // Populate product details before sending response
    await cart.populate({
      path: 'items.product',
      select: 'name price images stock'
    });

    return res.status(200).json({
      success: true,
      message: "Item added to cart",
      cart
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add item to cart",
      error: error.message
    });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const userId = req.user._id;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1"
      });
    }

    // Find user's cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    // Find the item in the cart
    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart"
      });
    }

    // Get product to check stock
    const product = await Product.findById(cart.items[itemIndex].product);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Check if quantity exceeds stock
    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: "Requested quantity exceeds available stock"
      });
    }

    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    // Populate product details before sending response
    await cart.populate({
      path: 'items.product',
      select: 'name price images stock'
    });

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cart
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update cart",
      error: error.message
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    // Find user's cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    // Remove item from cart
    cart.items = cart.items.filter(
      item => item._id.toString() !== itemId
    );

    await cart.save();

    // Populate product details before sending response
    await cart.populate({
      path: 'items.product',
      select: 'name price images stock'
    });

    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cart
    });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove item from cart",
      error: error.message
    });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find user's cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    // Clear all items
    cart.items = [];
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message
    });
  }
};