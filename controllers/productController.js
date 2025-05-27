import { Product } from "../models/productSchema.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Configure upload middleware
const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: fileFilter
}).array('images', 8); // Max 8 images

export const createProduct = async (req, res) => {
    console.log("Create product request received");
    
    uploadMiddleware(req, res, async function(err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred
            console.error("Multer error:", err);
            return res.status(400).json({
                success: false,
                message: `Upload error: ${err.message}`
            });
        } else if (err) {
            // An unknown error occurred
            console.error("Unknown error during upload:", err);
            return res.status(500).json({
                success: false,
                message: `Error: ${err.message}`
            });
        }
        
        try {
            console.log("Files received:", req.files);
            console.log("Request body:", req.body);
            
            // Get image paths from uploaded files
            const imageUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
            console.log("Image URLs:", imageUrls);
            
            // Get other product data from request body
            const { 
                discountvalue,
                productappearance,
                productstatus,
                productdetail,
                howtouse,
                ingredient,
                name, 
                brand, 
                description, 
                price, 
                stock, 
                category, 
                subcategory,
                rating,
                reviewsCount
            } = req.body;

            // Validate required fields
            if (!name || !price || !stock) {
                console.error("Missing required fields:", { name, price, stock });
                return res.status(400).json({ 
                    success: false, 
                    message: "Please provide name, price and stock" 
                });
            }

            // Create new product
            const product = await Product.create({
                discountvalue,
                productappearance,
                productstatus,
                productdetail,
                howtouse,
                ingredient,
                name,
                brand,
                description,
                price: parseFloat(price),
                stock: parseInt(stock),
                images: imageUrls,
                category,
                subcategory,
                rating: rating || 0,
                reviewsCount: reviewsCount || 0
            });

            console.log("Product created successfully:", product);
            return res.status(201).json({
                success: true,
                message: "Product created successfully",
                product
            });
        } catch (error) {
            console.error("Error creating product:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to create product",
                error: error.message
            });
        }
    });
};

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('category', 'name')
            .populate('subcategory', 'name');
        
        return res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch products",
            error: error.message
        });
    }
};

// Get a single product by ID
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const product = await Product.findById(id)
            .populate('category', 'name')
            .populate('subcategory', 'name');
            
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        
        return res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch product",
            error: error.message
        });
    }
};

// Update a product
export const updateProduct = async (req, res) => {
    uploadMiddleware(req, res, async function(err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: `Upload error: ${err.message}`
            });
        } else if (err) {
            return res.status(500).json({
                success: false,
                message: `Error: ${err.message}`
            });
        }
        
        try {
            const { id } = req.params;
            
            // Get existing product
            const existingProduct = await Product.findById(id);
            if (!existingProduct) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }
            
            // Get new image paths from uploaded files
            const newImageUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
            
            // Get existing images from request body if provided
            let existingImages = [];
            if (req.body.existingImages) {
                existingImages = typeof req.body.existingImages === 'string' 
                    ? req.body.existingImages.split(',').map(img => img.trim())
                    : req.body.existingImages;
            }
            
            // Combine existing and new images
            const allImages = [...existingImages, ...newImageUrls];
            
            // Prepare update data
            const updates = {
                ...req.body,
                images: allImages.length > 0 ? allImages : existingProduct.images,
                price: req.body.price ? parseFloat(req.body.price) : existingProduct.price,
                stock: req.body.stock ? parseInt(req.body.stock) : existingProduct.stock
            };
            
            // Remove existingImages field as it's not part of the schema
            delete updates.existingImages;
            
            // Update product
            const product = await Product.findByIdAndUpdate(
                id, 
                updates,
                { new: true, runValidators: true }
            );
            
            return res.status(200).json({
                success: true,
                message: "Product updated successfully",
                product
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: "Failed to update product",
                error: error.message
            });
        }
    });
};

// Delete a product
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        const product = await Product.findByIdAndDelete(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete product",
            error: error.message
        });
    }
};

//  this the wnistday changes  ######################




