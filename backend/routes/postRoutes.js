import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import { commentOnPost, createPost, deletePost, getAllPosts, getFollowingPosts, getLikedPosts, getUserPosts, likePost } from "../controllers/postController.js";

const router = express.Router();

router.get('/allPosts', protectRoute, getAllPosts);
router.get('/likes/:id', protectRoute, getLikedPosts);
router.get('/following', protectRoute, getFollowingPosts);
router.get('/user/:username', protectRoute, getUserPosts);


router.post('/create', protectRoute, createPost);
router.post('/like/:id', protectRoute, likePost);
router.post('/comment/:id', protectRoute, commentOnPost);


router.delete('/:id', protectRoute, deletePost);


export default router;