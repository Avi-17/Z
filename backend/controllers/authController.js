import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";


export const signUp = async (req, res) => {
    try{
        const {fullName, username, email, password} = req.body;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if(!emailRegex.test(email)){
            return res.status(400).json({error: "Please enter a valid mail format"})
        }

        const existingUser = await User.findOne({username});
        if(existingUser){
            return res.status(400).json({error: "Username is already taken"})
        }

        const existingEmail = await User.findOne({email})
        if(existingEmail) {
            return res.status(400).json({error: "Email already exists"})
        }

        if(password.length < 6){
            return res.status(400).json({error: "Password must be at least 6 characters long"})
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            username,
            email,
            password: hashPassword
        })

        if(newUser){
            generateTokenAndSetCookie(newUser._id, res);
            await newUser.save()

            return res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email,
                followers: newUser.followers,
                following: newUser.following,
                profileImg: newUser.profileImg,
                coverImg: newUser.coverImg
            })
        } else {
            return res.status(400).json({error: "Invalid user data"})
        }

    } catch(err) {
        console.error(err);
        return res.status(500).json({error: "Internal Server Error"})
    }
}

export const login = async (req, res) => {
    try{
        const {username, password} = req.body;
        const user = await User.findOne({username})

        if(!user){
            return res.status(404).json({error: "User not found. Try signing up"})
        }
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

        if(!isPasswordCorrect){
            return res.status(400).json({error: "Invalid Password"})
        }

        generateTokenAndSetCookie(user._id, res);

        return res.status(200).json({
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            followers: user.followers,
            following: user.following,
            profileImg: user.profileImg,
            coverImg: user.coverImg
        })

    } catch(err){
        console.error(err);
        return res.status(500).json({error: "Internal Server Error"})
    }
}

export const logout = async (req, res) => {
    try{
        res.cookie("jwt","",{maxAge: 0})
        res.status(200).json({message: "Logged out successfully"})
    } catch(err){
        console.error(err);
        return res.status(500).json({error: "Internal Server Error"})
    }
}

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        return res.status(200).json(user);
    } catch (error) {
        console.error(err);
        return res.status(500).json({error: "Internal Server Error"})
    }
}