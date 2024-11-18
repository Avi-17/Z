import mongoose from "mongoose";

const connect = async () => {
    try{
        const connection = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connected: ${connection.connection.host}`)
    } catch(err) {
        console.error(`Error connecting to database: ${err}`);
        process.exit(1);
    }
}

export default connect;