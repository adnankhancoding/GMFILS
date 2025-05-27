import { Category } from "../models/categorySchema.js";

// Create a new category
export const createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({ 
                success: false, 
                message: "Category name is required" 
            });
        }

        // Check if category already exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Category with this name already exists"
            });
        }

        // Create new category
        const category = await Category.create({ name });

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            category
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to create category",
            error: error.message
        });
    }
};

// Get all categories
export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        
        return res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch categories",
            error: error.message
        });
    }
};

// Get a single category by ID
export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const category = await Category.findById(id);
            
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }
        
        return res.status(200).json({
            success: true,
            category
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch category",
            error: error.message
        });
    }
};

// Update a category
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({ 
                success: false, 
                message: "Category name is required" 
            });
        }
        
        // Check if another category with the same name exists
        const existingCategory = await Category.findOne({ 
            name, 
            _id: { $ne: id } 
        });
        
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Category with this name already exists"
            });
        }
        
        // Find category and update it
        const category = await Category.findByIdAndUpdate(
            id, 
            { name },
            { new: true, runValidators: true }
        );
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update category",
            error: error.message
        });
    }
};

// Delete a category
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        const category = await Category.findByIdAndDelete(id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "Category deleted successfully"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete category",
            error: error.message
        });
    }
};