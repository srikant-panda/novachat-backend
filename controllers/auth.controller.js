import User from "../models/user.model.js";
import Session from "../models/auth.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { config } from "../config/config.js";
import crypto from "node:crypto";
import { signupSchema, signinSchema } from "../validators/user.schema.js";

const createToken = (id, email, exp) => {
  try {
    const JTI = crypto.randomUUID();
    // console.log(JTI);
    const token = jwt.sign({ id, email, JTI }, config.JWT_SECRET, {
      expiresIn: exp,
    });
    return { token, JTI };
  } catch (err) {
    console.log(err);
  }
};

const cookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: config.Production ? true : false,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const signupController = async (req, res) => {
  try {
    // const { email, password, name, age } = req.body;
    // console.log("recieved")
    // console.log(req.body)
    const result = signupSchema.safeParse(req.body);
    // console.log(result);
    if (!result.success) {
      return res.status(400).json({
        errors: result.error.issues,
      });
    }
    const { email, password, name, age } = result.data || {};
    if (!email || !password || !name || !age) {
      return res.status(400).json({
        message: "Email , password or name some filed are missing",
        success: false,
      });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({
        message: "user with this email alredy exist.",
        success: false,
      });
    }
    const hashPassword = await bcrypt.hash(password, 12);
    const userCreated = await User.create({
      name,
      email,
      age,
      password: hashPassword,
    });
    // console.log(user);
    if (userCreated) {
      const { token: accessToken, JTI: accessTokenJTI } = createToken(
        userCreated._id,
        email,
        "15m",
      );
      const { token: refreshToken, JTI: refreshTokenJTI } = createToken(
        userCreated._id,
        email,
        "7d",
      );
      console.log(refreshToken);
      const isStored = await Session.create({
        JTI: refreshTokenJTI,
        owner: userCreated._id,
      });
      res.set("Authorization", `Bearer ${accessToken}`);
      res.cookie("refreshToken", refreshToken, cookieOptions);
      res.status(201).json({ message: "User created.", success: true });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const loginController = async (req, res) => {
  try {
    // const { email, password } = req.body;
    const result = signinSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        errors: result.error.issues,
      });
    }
    const { email, password } = result.data || {};
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ message: "User not found.", success: false });
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched)
      return res
        .status(401)
        .json({ message: "Invalid credentials.", success: false });
    if (isPasswordMatched) {
      const { token: accessToken, JTI: accessTokenJTI } = createToken(
        user._id,
        email,
        "15m",
      );
      const { token: refreshToken, JTI: refreshTokenJTI } = createToken(
        user._id,
        email,
        "7d",
      );
      const isStored = await Session.create({
        JTI: refreshTokenJTI,
        owner: user._id,
      });
      res.set("Authorization", `Bearer ${accessToken}`);
      res.cookie("refreshToken", refreshToken, cookieOptions);
      res.json({ message: "User logged in.", success: true });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const logoutCotroller = async (req, res) => {
  try {
    const { id, JTI } = req.tokenData;
    const user = await User.findById(id);
    if (!user)
      return res
        .status(404)
        .json({ message: "User not found.", success: false });
    const isUpdated = await Session.findOneAndUpdate(
      { JTI },
      { revoked: true },
    );
    console.log(isUpdated);
    if (isUpdated) {
      res.clearCookie("refreshToken");
      res.json({ message: "User logged Out.", success: true });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

export const refreshController = async (req, res) => {
  try{
  // const old_JTI = req.tokenData.JTI;

  // const isRevoked = await Session.findOneAndUpdate(
  //   { JTI: old_JTI },
  //   { revoked: true },
  // );
  const user = await User.findById(req.tokenData.id);
  // const { token: newRefreshToken, JTI: newRefreshJTI } = createToken(
  //   req.tokenData.id,
  //   user.email,
  //   "7d",
  // );
  const { token: newaccessToken } = createToken(
    req.tokenData.id,
    user.email,
    "15m",
  );

  // const session = await Session.create({
  //   JTI: newRefreshJTI,
  //   owner: req.tokenData.id,
  // });

  // res.cookie("refreshToken",newRefreshToken,cookieOptions);
  res.header("Authorization",newaccessToken);
  res.json({ message:"Token refreshed.",success:true });
}catch(err){
  console.log(err);
  res.status(500).json({ message:"Internal server error." })
}
};
