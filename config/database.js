import mongoose from "mongoose";
import { config } from "./config.js";

export const connectDB = async () =>{
    try{
        const db = await mongoose.connect(config.MONGO_URI);
        console.log("Database connected.","database host:",db.connection.host,"database name:",db.connection.name);
        return db;
    } catch(err){
        throw new Error("Database connection failed. Plese check your MONGO_URI in the .env file.  OR internet Error: "+err.message);
    }
}