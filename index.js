import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { fileURLToPath } from 'url';
import path from 'path';
import databaseConnection from "./config/database.js";

// Import routes
import userRoute from "./routes/userRoute.js";
import productRoute from "./routes/productRoute.js";
import categoryRoute from "./routes/categoryRoute.js";
import subcategoryRoute from "./routes/subcategoryRoute.js";
import cartRoute from "./routes/cartRoute.js";
import orderRoute from "./routes/orderRoute.js";
import reviewRoute from "./routes/reviewRoute.js";
import favoriteRoute from "./routes/favoriteRoute.js";
import blogRoute from "./routes/blogRoute.js";

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
databaseConnection();

// Configure CORS
app.use(cors({
  origin: 'https://gmfils.com/', // Your frontend origin
  //  origin: 'http://localhost:3000', // Your frontend origin
  credentials: true, // Allow credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Serve static files from the public directory
app.use(express.static('public'));

// Explicitly serve the uploads directory for blog images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log all requests to debug issues
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/", userRoute);
app.use("/", favoriteRoute); // Make sure favoriteRoute is registered correctly
app.use(productRoute);
app.use(categoryRoute);
app.use(subcategoryRoute);
app.use(cartRoute);
app.use(orderRoute);
app.use(reviewRoute);
app.use(blogRoute);

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
//  this the wnistday changes ######################}########
