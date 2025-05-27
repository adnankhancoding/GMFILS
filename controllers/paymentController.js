import { Payment } from "../models/paymentSchema.js";
import { Order } from "../models/orderSchema.js";

// Create a new payment
export const createPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, transactionId, amount } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!orderId || !paymentMethod || !amount) {
      return res.status(400).json({
        success: false,
        message: "Order ID, payment method, and amount are required"
      });
    }

    // Check if order exists and belongs to the user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Verify the order belongs to the current user (unless admin)
    if (req.user.role !== 'admin' && order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to make payment for this order"
      });
    }

    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({ order: orderId });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment already exists for this order"
      });
    }

    // Create new payment
    const payment = await Payment.create({
      order: orderId,
      paymentMethod,
      transactionId: transactionId || `TXN_${Date.now()}`,
      amount,
      status: 'Success' // Default to success for now
    });

    // Update order payment status
    await Order.findByIdAndUpdate(orderId, { paymentStatus: 'Paid' });

    return res.status(201).json({
      success: true,
      message: "Payment processed successfully",
      payment
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process payment",
      error: error.message
    });
  }
};

// Get all payments (admin only)
export const getAllPayments = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }

    const payments = await Payment.find()
      .populate({
        path: 'order',
        select: 'user totalPrice status',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    console.error("Get all payments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message
    });
  }
};

// Get user payments
export const getUserPayments = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find orders for this user
    const userOrders = await Order.find({ user: userId }).select('_id');
    const orderIds = userOrders.map(order => order._id);

    // Find payments for these orders
    const payments = await Payment.find({ order: { $in: orderIds } })
      .populate({
        path: 'order',
        select: 'totalPrice status products shippingAddress createdAt',
        populate: {
          path: 'products.product',
          select: 'name images'
        }
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    console.error("Get user payments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your payments",
      error: error.message
    });
  }
};

// Get payment by ID
export const getPaymentById = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const userId = req.user._id;

    const payment = await Payment.findById(paymentId)
      .populate({
        path: 'order',
        select: 'user totalPrice status products shippingAddress createdAt',
        populate: [
          {
            path: 'user',
            select: 'name email'
          },
          {
            path: 'products.product',
            select: 'name images'
          }
        ]
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    // Check if user is authorized to view this payment
    if (
      req.user.role !== 'admin' && 
      payment.order.user._id.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this payment"
      });
    }

    return res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    console.error("Get payment by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment details",
      error: error.message
    });
  }
};

// Update payment status (admin only)
export const updatePaymentStatus = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }

    const paymentId = req.params.id;
    const { status } = req.body;

    // Validate status
    if (!status || !['Success', 'Failed', 'Pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status (Success, Failed, or Pending) is required"
      });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    // Update payment status
    payment.status = status;
    await payment.save();

    // If payment status is changed to Failed, update order payment status
    if (status === 'Failed') {
      await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'Unpaid' });
    } else if (status === 'Success') {
      await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'Paid' });
    }

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      payment
    });
  } catch (error) {
    console.error("Update payment status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update payment status",
      error: error.message
    });
  }
};



