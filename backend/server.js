import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import {v2 as cloudinary} from "cloudinary";

import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import connect from "./db/connect.js";



dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET  
})

const app = express();
const PORT = process.env.PORT || 8000

app.use(express.json())     //parses req.body
app.use(express.urlencoded({ extended: true })); //to parse form data
app.use(cookieParser());


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.listen(8000, () => {
    console.log(`Server is running on port ${PORT}`)
    connect();
})