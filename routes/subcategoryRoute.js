import express from "express";
import { 
    createSubcategory, 
    getAllSubcategories,
    getSubcategoriesByCategory,
    getSubcategoryById,
    updateSubcategory,
    deleteSubcategory 
} from "../controllers/subcategoryController.js";

const router = express.Router();

// Create a new subcategory
router.post("/subcategories", createSubcategory);

// Get all subcategories
router.get("/subcategories", getAllSubcategories);

// Get subcategories by category ID
router.get("/subcategories/category/:categoryId", getSubcategoriesByCategory);

// Get a single subcategory by ID
router.get("/subcategories/:id", getSubcategoryById);

// Update a subcategory
router.put("/subcategories/:id", updateSubcategory);

// Delete a subcategory
router.delete("/subcategories/:id", deleteSubcategory);

export default router;