import { Order } from "../models/orderSchema.js";
import { Cart } from "../models/cartSchema.js";
import { Product } from "../models/productSchema.js";
import moment from 'moment';

// Create a new order
export const createOrder = async (req, res) => {
  try {
    console.log("==== ORDER CREATION STARTED ====");
    
    // Extract data from request body
    const { shippingAddress } = req.body;
    
    // Generate a unique 5-digit order number
    const orderNumber = Math.floor(10000 + Math.random() * 90000).toString();
    
    console.log("Using order number:", orderNumber);
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login."
      });
    }
    
    const userId = req.user._id;

    // Validate shipping address
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required"
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty"
      });
    }

    // Check stock availability and prepare order items
    const orderProducts = [];
    let totalPrice = 0;
    
    for (const item of cart.items) {
      const product = item.product;
      
      // Check if product exists and has enough stock
      if (!product) {
        return res.status(400).json({
          success: false,
          message: "One of the products in your cart is no longer available"
        });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} units of ${product.name} are available`
        });
      }
      
      // Add to order products - include name field
      orderProducts.push({
        product: product._id,
        name: product.name, // Add the product name
        quantity: item.quantity,
        price: product.price
      });
      
      // Update total price
      totalPrice += product.price * item.quantity;
      
      // Update product stock
      await Product.findByIdAndUpdate(product._id, {
        $inc: { stock: -item.quantity }
      });
    }

    // Create order with the 5-digit orderNumber
    const orderData = {
      orderNumber: orderNumber,
      user: userId,
      products: orderProducts,
      shippingAddress,
      totalPrice,
      status: 'Pending',
      paymentStatus: 'Pending'
    };
    
    console.log("Creating order with data:", JSON.stringify(orderData, null, 2));
    
    // Create the order
    const order = await Order.create(orderData);
    
    // Update product stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity }
      });
    }

    // Clear user's cart
    cart.items = [];
    await cart.save();

    // Populate order details
    await order.populate([
      { path: 'user', select: 'name email' },
      { path: 'products.product', select: 'name images' }
    ]);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message
    });
  }
};

// Get all orders (admin only)
export const getAllOrders = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }

    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('products.product', 'name images')
      .sort({ createdAt: -1 });
  
   console.log("orders1", orders)
    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message
    });
  }
};

// Get user orders
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const orders = await Order.find({ user: userId })
      .populate('products.product', 'name images')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message
    });
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const order = await Order.findById(id)
      .populate('user', 'name email')
      .populate('products.product', 'name images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if user is admin or the order belongs to the user
    if (req.user.role !== 'admin' && order.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own orders."
      });
    }

    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message
    });
  }
};

// Update order status (admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    
    console.log('Backend: Updating order:', { id, body: req.body }); // Debug log

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Store previous status for stock handling
    const previousStatus = order.status;

    // Update status if provided
    if (status) {
      if (!['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value"
        });
      }
      order.status = status;
    }

    // Update payment status if provided
    if (paymentStatus) {
      if (!['Pending', 'Paid', 'Refunded'].includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status value"
        });
      }
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    // If order is cancelled and wasn't cancelled before, restore product stock
    if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
      for (const item of order.products) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    }

    // Populate order details
    await order.populate([
      { path: 'user', select: 'name email' },
      { path: 'products.product', select: 'name images' }
    ]);

    console.log('Backend: Order updated successfully:', { 
      status: order.status, 
      paymentStatus: order.paymentStatus 
    });

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order
    });
  } catch (error) {
    console.error("Backend: Error updating order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update order",
      error: error.message
    });
  }
};

// Cancel order (user can cancel their own pending orders)
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if order belongs to user
    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only cancel your own orders."
      });
    }

    // Check if order can be cancelled (only pending orders)
    if (order.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled"
      });
    }

    // Update order status
    order.status = 'Cancelled';
    await order.save();

    // Restore product stock
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    // Populate order details
    await order.populate([
      { path: 'user', select: 'name email' },
      { path: 'products.product', select: 'name images' }
    ]);

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message
    });
  }
};

// Delete order (admin only)
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Backend: Deleting order with ID:', id); // Debug log

    // Check if user is admin
    if (req.user.role !== 'admin') {
      console.log('Backend: Access denied - not admin'); // Debug log
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      console.log('Backend: Order not found'); // Debug log
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    console.log('Backend: Found order, proceeding with deletion'); // Debug log

    // If order is not cancelled, restore product stock
    if (order.status !== 'Cancelled') {
      for (const item of order.products) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    }

    // Delete the order
    await Order.findByIdAndDelete(id);
    console.log('Backend: Order deleted successfully'); // Debug log

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully"
    });
  } catch (error) {
    console.error("Backend: Error deleting order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: error.message
    });
  }
};

// Get completed orders (Paid + Delivered) by month
export const getCompletedOrdersByMonth = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }

    const { month, year } = req.query;
    
    // Validate month and year
    const currentDate = new Date();
    const queryMonth = month ? parseInt(month) : currentDate.getMonth() + 1; // Current month if not specified
    const queryYear = year ? parseInt(year) : currentDate.getFullYear(); // Current year if not specified
    
    if (isNaN(queryMonth) || queryMonth < 1 || queryMonth > 12) {
      return res.status(400).json({
        success: false,
        message: "Invalid month. Must be between 1 and 12."
      });
    }
    
    if (isNaN(queryYear) || queryYear < 2000 || queryYear > 2100) {
      return res.status(400).json({
        success: false,
        message: "Invalid year. Must be between 2000 and 2100."
      });
    }
    
    // Calculate start and end dates for the specified month
    const startDate = new Date(queryYear, queryMonth - 1, 1); // Month is 0-indexed in JS Date
    const endDate = new Date(queryYear, queryMonth, 0); // Last day of the month
    endDate.setHours(23, 59, 59, 999);
    
    console.log(`Fetching completed orders from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Find orders that are both paid and delivered in the specified month
    const completedOrders = await Order.find({
      status: 'Delivered',
      paymentStatus: 'Paid',
      updatedAt: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .populate('user', 'name email')
    .populate('products.product', 'name images')
    .sort({ updatedAt: -1 });
    
    // Calculate total revenue
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    
    return res.status(200).json({
      success: true,
      count: completedOrders.length,
      totalRevenue,
      month: queryMonth,
      year: queryYear,
      orders: completedOrders
    });
  } catch (error) {
    console.error("Error fetching completed orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch completed orders",
      error: error.message
    });
  }
};

// Get completed orders (Paid + Delivered) by week
export const getCompletedOrdersByWeek = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }

    const { week, year } = req.query;
    
    // Validate week and year
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Get current week if not specified
    const currentWeek = week ? parseInt(week) : moment().week();
    const queryYear = year ? parseInt(year) : currentYear;
    
    if (isNaN(queryYear) || queryYear < 2000 || queryYear > 2100) {
      return res.status(400).json({
        success: false,
        message: "Invalid year. Must be between 2000 and 2100."
      });
    }
    
    if (isNaN(currentWeek) || currentWeek < 1 || currentWeek > 53) {
      return res.status(400).json({
        success: false,
        message: "Invalid week. Must be between 1 and 53."
      });
    }
    
    // Calculate start and end dates for the specified week
    const startOfWeek = moment().year(queryYear).week(currentWeek).startOf('week').toDate();
    const endOfWeek = moment().year(queryYear).week(currentWeek).endOf('week').toDate();
    
    console.log(`Fetching completed orders from ${startOfWeek.toISOString()} to ${endOfWeek.toISOString()}`);
    
    // Find orders that are both paid and delivered in the specified week
    const completedOrders = await Order.find({
      status: 'Delivered',
      paymentStatus: 'Paid',
      updatedAt: {
        $gte: startOfWeek,
        $lte: endOfWeek
      }
    })
    .populate('user', 'name email')
    .populate('products.product', 'name images')
    .sort({ updatedAt: -1 });
    
    // Calculate total revenue
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    
    return res.status(200).json({
      success: true,
      count: completedOrders.length,
      totalRevenue,
      week: currentWeek,
      year: queryYear,
      orders: completedOrders
    });
  } catch (error) {
    console.error("Error fetching completed orders by week:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch completed orders by week",
      error: error.message
    });
  }
};

// Get completed orders (Paid + Delivered) by year
export const getCompletedOrdersByYear = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }

    const { year } = req.query;
    
    // Validate year
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const queryYear = year ? parseInt(year) : currentYear;
    
    if (isNaN(queryYear) || queryYear < 2000 || queryYear > 2100) {
      return res.status(400).json({
        success: false,
        message: "Invalid year. Must be between 2000 and 2100."
      });
    }
    
    // Calculate start and end dates for the specified year
    const startOfYear = new Date(queryYear, 0, 1); // January 1st
    const endOfYear = new Date(queryYear, 11, 31, 23, 59, 59, 999); // December 31st, 23:59:59.999
    
    console.log(`Fetching completed orders from ${startOfYear.toISOString()} to ${endOfYear.toISOString()}`);
    
    // Find orders that are both paid and delivered in the specified year
    const completedOrders = await Order.find({
      status: 'Delivered',
      paymentStatus: 'Paid',
      updatedAt: {
        $gte: startOfYear,
        $lte: endOfYear
      }
    })
    .populate('user', 'name email')
    .populate('products.product', 'name images')
    .sort({ updatedAt: -1 });
    
    // Calculate total revenue
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    
    // Calculate monthly breakdown
    const monthlyData = Array(12).fill(0).map((_, index) => ({
      month: index + 1,
      name: moment().month(index).format('MMMM'),
      orders: 0,
      revenue: 0
    }));
    
    // Populate monthly data
    completedOrders.forEach(order => {
      const orderMonth = new Date(order.updatedAt).getMonth(); // 0-11
      monthlyData[orderMonth].orders += 1;
      monthlyData[orderMonth].revenue += order.totalPrice;
    });
    
    return res.status(200).json({
      success: true,
      count: completedOrders.length,
      totalRevenue,
      year: queryYear,
      monthlyData,
      orders: completedOrders
    });
  } catch (error) {
    console.error("Error fetching completed orders by year:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch completed orders by year",
      error: error.message
    });
  }
};
// after monthly reports   this changes is implemented  
// yearly reports also  add here now



