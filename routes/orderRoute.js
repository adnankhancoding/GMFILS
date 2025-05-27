import express from "express";
import { 
  createOrder, 
  getAllOrders, 
  getUserOrders, 
  getOrderById, 
  updateOrderStatus, 
  cancelOrder,
  deleteOrder,
  getCompletedOrdersByMonth,
  getCompletedOrdersByWeek,
  getCompletedOrdersByYear
} from "../controllers/orderController.js";
import { isAuthenticated, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// All order routes require authentication
router.use(isAuthenticated);

// Create a new order
router.post("/orders", createOrder);

// Get all orders (admin only)
router.get("/admin/orders", isAdmin, getAllOrders);

// Get completed orders by month (admin only)
router.get("/admin/orders/completed", isAdmin, getCompletedOrdersByMonth);

// Get completed orders by week (admin only)
router.get("/admin/orders/completed-weekly", isAdmin, getCompletedOrdersByWeek);

// Get completed orders by year (admin only)
router.get("/admin/orders/completed-yearly", isAdmin, getCompletedOrdersByYear);

// Get user orders
router.get("/orders", getUserOrders);

// Get order by ID
router.get("/orders/:id", getOrderById);

// Update order status (admin only)
router.put("/admin/orders/:id", isAdmin, updateOrderStatus);

// Delete order (admin only)
router.delete("/admin/orders/:id", isAdmin, deleteOrder);

// Cancel order (user can cancel their own pending orders)
router.put("/orders/:id/cancel", cancelOrder);

export default router;

//  this  changes  implemented after  monthly report 
// yearly reports also  add here now ##########


