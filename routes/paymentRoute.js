import express from "express";
import { 
  createPayment, 
  getAllPayments, 
  getUserPayments, 
  getPaymentById, 
  updatePaymentStatus 
} from "../controllers/paymentController.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

// All payment routes require authentication
router.use(isAuthenticated);

// Create a new payment
router.post("/payments", createPayment);

// Get all payments (admin only)
router.get("/admin/payments", getAllPayments);

// Get user payments
router.get("/payments", getUserPayments);

// Get payment by ID
router.get("/payments/:id", getPaymentById);

// Update payment status (admin only)
router.put("/admin/payments/:id", updatePaymentStatus);

export default router;