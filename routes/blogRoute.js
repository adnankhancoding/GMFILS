import express from "express";
import { 
  getAllBlogs,
  getPublishedBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogsByCategory,
  getBlogsByAuthor
} from "../controllers/blogController.js";
import { isAuthenticated, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/blogs", getPublishedBlogs);
router.get("/blogs/:id", getBlogById);
router.get("/blogs/category/:categoryId", getBlogsByCategory);
router.get("/blogs/author/:authorId", getBlogsByAuthor);

// Admin routes (protected)
router.get("/admin/blogs", isAuthenticated, isAdmin, getAllBlogs);
router.post("/blogs", isAuthenticated, isAdmin, createBlog);
router.put("/blogs/:id", isAuthenticated, isAdmin, updateBlog);
router.delete("/blogs/:id", isAuthenticated, isAdmin, deleteBlog);

// Test endpoint for image serving
router.get("/test-image", (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Image Test</h1>
        <div>
          <p>If you see an image below, image serving is working:</p>
          <img src="/uploads/test-image.jpg" alt="Test Image" style="max-width: 300px;" />
          <p>Path: /uploads/test-image.jpg</p>
        </div>
      </body>
    </html>
  `);
});

export default router;
