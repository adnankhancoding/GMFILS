import { Subcategory } from "../models/subcategorySchema.js";
import { Category } from "../models/categorySchema.js";

// Create a new subcategory
export const createSubcategory = async (req, res) => {
    try {
        const { name, category } = req.body;

        // Validate required fields
        if (!name || !category) {
            return res.status(400).json({ 
                success: false, 
                message: "Subcategory name and category ID are required" 
            });
        }

        // Check if category exists
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Check if subcategory already exists in this category
        const existingSubcategory = await Subcategory.findOne({ name, category });
        if (existingSubcategory) {
            return res.status(400).json({
                success: false,
                message: "Subcategory with this name already exists in this category"
            });
        }

        // Create new subcategory
        const subcategory = await Subcategory.create({ name, category });

        return res.status(201).json({
            success: true,
            message: "Subcategory created successfully",
            subcategory
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to create subcategory",
            error: error.message
        });
    }
};

// Get all subcategories
export const getAllSubcategories = async (req, res) => {
    try {
        const subcategories = await Subcategory.find()
            .populate('category', 'name')
            .sort({ name: 1 });
        
        return res.status(200).json({
            success: true,
            count: subcategories.length,
            subcategories
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch subcategories",
            error: error.message
        });
    }
};

// Get subcategories by category ID
export const getSubcategoriesByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        
        // Check if category exists
        const categoryExists = await Category.findById(categoryId);
        if (!categoryExists) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }
        
        const subcategories = await Subcategory.find({ category: categoryId })
            .populate('category', 'name')
            .sort({ name: 1 });
        
        return res.status(200).json({
            success: true,
            count: subcategories.length,
            subcategories
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch subcategories",
            error: error.message
        });
    }
};

// Get a single subcategory by ID
export const getSubcategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const subcategory = await Subcategory.findById(id)
            .populate('category', 'name');
            
        if (!subcategory) {
            return res.status(404).json({
                success: false,
                message: "Subcategory not found"
            });
        }
        
        return res.status(200).json({
            success: true,
            subcategory
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch subcategory",
            error: error.message
        });
    }
};

// Update a subcategory
export const updateSubcategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category } = req.body;
        
        // Validate required fields
        if (!name || !category) {
            return res.status(400).json({ 
                success: false, 
                message: "Subcategory name and category ID are required" 
            });
        }
        
        // Check if category exists
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }
        
        // Check if another subcategory with the same name exists in this category
        const existingSubcategory = await Subcategory.findOne({ 
            name, 
            category,
            _id: { $ne: id } 
        });
        
        if (existingSubcategory) {
            return res.status(400).json({
                success: false,
                message: "Subcategory with this name already exists in this category"
            });
        }
        
        // Find subcategory and update it
        const subcategory = await Subcategory.findByIdAndUpdate(
            id, 
            { name, category },
            { new: true, runValidators: true }
        ).populate('category', 'name');
        
        if (!subcategory) {
            return res.status(404).json({
                success: false,
                message: "Subcategory not found"
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "Subcategory updated successfully",
            subcategory
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update subcategory",
            error: error.message
        });
    }
};

// Delete a subcategory
export const deleteSubcategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        const subcategory = await Subcategory.findByIdAndDelete(id);
        
        if (!subcategory) {
            return res.status(404).json({
                success: false,
                message: "Subcategory not found"
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "Subcategory deleted successfully"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete subcategory",
            error: error.message
        });
    }
};
