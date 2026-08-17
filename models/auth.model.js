import mongoose from "mongoose";


const sessionSchema = new mongoose.Schema({
    JTI : {
        type:String,
        required:true,
        unique:true,
    },
    revoked:{
        type:Boolean,
        default:false
    },
    owner:{
        type:mongoose.Types.ObjectId,
        required:true,
        ref:"User"
    },
    exipresAt:{
        type:Date,
        default: () => new Date(Date.now()+7*24*60*60*1000)
    },

})


const Session = mongoose.model("session",sessionSchema);

export default Session;