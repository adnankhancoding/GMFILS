import express from "express";

const router = express.Router();

// Test route that doesn't require authentication
router.get("/test-route", (req, res) => {
  res.status(200).json({ message: "Test route is working" });
});

// Test favorite route
router.post("/test-favorites/:productId", (req, res) => {
  const { productId } = req.params;
  res.status(200).json({ 
    success: true,
    message: `Added product ${productId} to favorites (test)`,
    productId
  });
});

export default router;
