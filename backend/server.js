import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js"
import connect from "./db/connect.js";
import cookieParser from "cookie-parser";



dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000

app.use(express.json())     //parses req.body
app.use(express.urlencoded({ extended: true })); //to parse form data
app.use(cookieParser());


app.use('/api/auth', authRoutes)

app.listen(8000, () => {
    console.log(`Server is running on port ${PORT}`)
    connect();
})