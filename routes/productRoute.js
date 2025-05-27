import express from "express";
import { 
    createProduct, 
    getAllProducts, 
    getProductById,
    updateProduct,
    deleteProduct 
} from "../controllers/productController.js";

const router = express.Router();

// Create a new product
router.post("/products", createProduct);

// Get all products
router.get("/products", getAllProducts);

// Get a single product by ID
router.get("/products/:id", getProductById);

// Update a product
router.put("/products/:id", updateProduct);

// Delete a product
router.delete("/products/:id", deleteProduct);

export default router;

//  this the wnistday changes###################################################