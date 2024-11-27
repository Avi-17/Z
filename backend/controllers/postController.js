import Notification from "../models/notificationModel.js";
import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import {v2 as cloudinary} from "cloudinary";

export const createPost = async(req, res) => {
    try {
        const {caption} = req.body;
        let { img } = req.body;
        const userId = req.user._id.toString();

        const user = await User.findById(userId);
        if(!user) return res.status(404).json({error: "User not found"});

        if(!img && !caption) return res.status(400).json({error: "Post must have text or image"});

        if(img){
            const upload = await cloudinary.uploader.upload(img);
            img = upload.secure_url
        }

        const newPost = new Post({
            user: userId,
            text: caption,
            img: img,
        })

        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        console.error(error)
        return res.status(500).json({error: "Internal Server Error"})
    }
}

export const deletePost = async(req, res) => {
    try {
        const {id} = req.params;
        const post = await Post.findById(id);
        if(!post){
            return res.status(404).json({error: "Post not found"})
        }

        if(post.user.toString() != req.user._id.toString()){
            return res.status(401).json({error: "You can only delete your own posts"})
        }
        if(post.img){
            await cloudinary.uploader.destroy(post.img.split("/").pop().split(".")[0]);
        }

        await Post.findByIdAndDelete(id);
        res.status(200).json({message: "Post deleted successfully"})
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Internal Server Error."})
    }
}

export const commentOnPost = async(req, res) => {
    try {
        const {comment} = req.body;
        const postId = req.params.id;
        const userId = req.user._id;

        if(!comment){
            return res.status(400).json({error: "Comment field is required"})
        }
        const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({error: "Post not found"})
        }

        const commentToPush = {text: comment, user: userId};
        post.comments.push(commentToPush);
        await post.save();

        res.status(200).json(post);
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Internal Server Error"})
    }


}

export const likePost = async(req, res) => {
    try {
        const {id} = req.params;
        const userId = req.user._id;
        const post = await Post.findById(id);
        if(!post){
            return res.status(404).json({error: "Post not found"});
        }

        const userLikedPost = post.likes.includes(userId);
        if(userLikedPost){
            await Post.updateOne( { _id: id }, { $pull: { likes: userId } } );
            await User.updateOne({_id: userId}, {$pull: {likedPosts: id}});
            return res.status(200).json({message: "You unliked this post"});
        }else{
            post.likes.push(userId);
            await User.updateOne( { _id: userId }, { $push: { likedPosts: id } } )
            await post.save();
            
            const notification = new Notification({
                from: userId,
                to: post.user,
                type:"like"
            })
            await notification.save();

            return res.status(200).json({message: "Post liked successfully"});
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Internal Server Error."})
    }
}

export const getAllPosts = async(req, res) => {
    try {
        const posts = await Post.find().sort({createdAt: -1})
                        .populate({path:"user", select: "-password"})
                        .populate({path: "comments.user", select: "-password"})
        
        if(posts.length === 0){
            return res.status(200).json([]);
        }

        return res.status(200).json(posts);
    } catch (error) {
        console.error(error)
        return res.status(500).json({error: "Internal Server Error."})
    }
}

export const getLikedPosts = async(req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({error: "User not found"})
        }
        const likedPosts = await Post.find({_id: {$in: user.likedPosts}})
        .populate({path:"user", select: "-password"})
        .populate({path: "comments.user", select: "-password"})

        return res.status(200).json(likedPosts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Internal Server Error"})
    }
}

export const getFollowingPosts = async(req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if(!user) return res.status(404).json({error: "User not found"});

        const following = user.following;
        const feedPosts = await Post.find({user: {$in: following}})
                          .sort({createdAt: -1})
                          .populate({path:"user", select: "-password"})
                          .populate({path: "comments.user", select:"-password"})
        
        return res.status(200).json(feedPosts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Internal Server Error"})
    }
}

export const getUserPosts = async(req, res) => {
    try {
        const {username} = req.params
        const user = await User.findOne({username});
        if(!user) return res.status(404).json({error: "User not found"})

        const posts = await Post.find({user: user._id})
                      .sort({createdAt: -1})
                      .populate({
                        path: "user",
                        select: "-password"
                      }).populate({
                        path: "comments.user",
                        select: "-password"
                      })
        
        res.status(200).json(posts);

    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Internal Server Error."})
    }
}