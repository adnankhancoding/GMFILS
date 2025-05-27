import { Order } from "../models/orderSchema.js";

/**
 * Generate a unique 5-digit order number
 * @returns {Promise<string>} A unique 5-digit order number
 */
export const generateUniqueOrderNumber = async () => {
  let isUnique = false;
  let orderNumber;
  
  while (!isUnique) {
    // Generate a 5-digit random number
    orderNumber = Math.floor(10000 + Math.random() * 90000).toString();
    
    // Check if this order number already exists
    const existingOrder = await Order.findOne({ orderNumber });
    
    if (!existingOrder) {
      isUnique = true;
    }
  }
  
  return orderNumber;
};