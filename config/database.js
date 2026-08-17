import mongoose from "mongoose";
import { config } from "./config.js";

export const connectDB = async () =>{
    try{
        const db = await mongoose.connect(config.MONGO_URI);
        console.log("Database connected.","database host:",db.connection.host,"database name:",db.connection.name);
    } catch(err){
        console.log(err);
    }
}