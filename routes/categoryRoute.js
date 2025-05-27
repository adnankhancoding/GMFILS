import express from "express";
import { 
    createCategory, 
    getAllCategories, 
    getCategoryById,
    updateCategory,
    deleteCategory 
} from "../controllers/categoryController.js";

const router = express.Router();

// Create a new category
router.post("/addcategory", createCategory);

// Get all categories
router.get("/categories", getAllCategories);

// Get a single category by ID
router.get("/categories/:id", getCategoryById);

// Update a category
router.put("/categories/:id", updateCategory);

// Delete a category
router.delete("/categories/:id", deleteCategory);

export default router;