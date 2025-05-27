import { Blog } from "../models/blogSchema.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `blog-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
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
}).array('images', 8); // Changed to array to support multiple images, max 8

// Get all blogs
export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().populate('category');
    res.status(200).json({
      success: true,
      blogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get published blogs
export const getPublishedBlogs = async (req, res) => {
  try {
    console.log("Fetching published blogs...");
    
    // Query for blogs where published is not 'draft'
    const blogs = await Blog.find({ published: { $ne: 'draft' } }).populate('category');
    console.log(`Found ${blogs.length} published blogs`);
    
    res.status(200).json({
      success: true,
      blogs
    });
  } catch (error) {
    console.error("Error fetching published blogs:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get blog by ID
export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('category');
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found"
      });
    }
    
    console.log("Blog found:", blog._id);
    console.log("Blog images:", blog.images);
    
    res.status(200).json({
      success: true,
      blog
    });
  } catch (error) {
    console.error("Error fetching blog by ID:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create new blog
export const createBlog = async (req, res) => {
  uploadMiddleware(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err);
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      console.error("Unknown error during upload:", err);
      return res.status(500).json({
        success: false,
        message: `Error: ${err.message}`
      });
    }
    
    try {
      console.log("Request body:", req.body);
      console.log("Files:", req.files);
      
      // Create blog data object
      const blogData = {
        ...req.body
      };
      
      // Add image paths if files were uploaded
      if (req.files && req.files.length > 0) {
        blogData.images = req.files.map(file => `/${uploadDir}/${file.filename}`);
      }
      
      // Create the blog
      const blog = await Blog.create(blogData);
      
      res.status(201).json({
        success: true,
        blog
      });
    } catch (error) {
      console.error("Error creating blog:", error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  });
};

// Update blog
export const updateBlog = async (req, res) => {
  uploadMiddleware(req, res, async function(err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    try {
      const blogData = { ...req.body };
      
      // Handle existing images
      let existingImages = [];
      if (req.body.existingImages) {
        existingImages = req.body.existingImages.split(',').filter(img => img.trim() !== '');
      }
      
      // Add new image paths if files were uploaded
      const newImages = req.files ? req.files.map(file => `/${uploadDir}/${file.filename}`) : [];
      
      // Combine existing and new images
      blogData.images = [...existingImages, ...newImages];
      
      // Remove existingImages field as it's not part of the schema
      delete blogData.existingImages;
      
      const blog = await Blog.findByIdAndUpdate(
        req.params.id,
        blogData,
        { new: true, runValidators: true }
      );
      
      if (!blog) {
        return res.status(404).json({
          success: false,
          message: "Blog not found"
        });
      }
      
      res.status(200).json({
        success: true,
        blog
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  });
};

// Delete blog
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Blog deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get blogs by category
export const getBlogsByCategory = async (req, res) => {
  try {
    const blogs = await Blog.find({ 
      category: req.params.categoryId,
      published: true 
    }).populate('category');
    
    res.status(200).json({
      success: true,
      blogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get blogs by author
export const getBlogsByAuthor = async (req, res) => {
  try {
    const blogs = await Blog.find({ 
      author: req.params.authorId 
    }).populate('category');
    
    res.status(200).json({
      success: true,
      blogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



