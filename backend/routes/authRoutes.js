import express from "express";
import { getMe, login, logout, signUp } from "../controllers/authController.js";
import { protectRoute } from "../middlewares/protectRoute.js";

const router = express.Router();

router.get('/me', protectRoute, getMe)

router.post('/signup', signUp);
router.post('/login', login);
router.post('/logout', logout);



export default router;