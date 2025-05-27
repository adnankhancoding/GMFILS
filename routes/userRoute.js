import express from "express";
import { Login, Register, Logout, checkAuth, googleLogin } from "../controllers/userController.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();
router.route("/register").post(Register);
router.route("/login").post(Login);
router.route("/logout").get(Logout);
router.route("/check-auth").get(isAuthenticated, checkAuth);
router.route("/google-login").post(googleLogin);

export default router;
// #####################






