import User from "../models/user.model.js";



export const createUser = async ( userData = {} ) =>{
    const  user = await User.create({
        name:userData.name,
        age:userData.age || null,
        email:userData.email,
        password:userData.password || null,
        method:{
            name:userData.method,
            clientID:userData.clientID || null
        },
    })
    return user;
}