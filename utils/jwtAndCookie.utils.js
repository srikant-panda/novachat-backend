import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/auth.model.js";
import { config } from "../config/config.js";

export const createToken = (id, email, exp) => {
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

export const getCookieOptions = (req) => {
  // On Vercel the app sits behind a TLS proxy; req.secure is true because
  // server.js sets `trust proxy`. The header check is a fallback for any
  // proxy that doesn't rewrite req.secure.
  const isHttps = req
    ? req.secure || req.headers?.["x-forwarded-proto"] === "https"
    : false;
  const isSecure = config.PRODUCTION || isHttps;

  return {
    httpOnly: true,
    // Frontend (vercel.app) and backend are on different sites, so the
    // refreshToken cookie must be cross-site capable: SameSite=None,
    // which browsers only accept together with Secure.
    sameSite: isSecure ? "none" : "lax",
    secure: isSecure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
};

export const cookieOptions = getCookieOptions();

export const sendTokens = async (res, user, req) => {
  const { token: accessToken, JTI: accessTokenJti } = createToken(
    user._id,
    user.email,
    "15m",
  );
  const { token: refreshToken, JTI: refreshTokenJTI } = createToken(
    user._id,
    user.email,
    "7d",
  );

  const isStored = await Session.create({
    JTI: refreshTokenJTI,
    owner: user._id,
  });
  if (isStored) {
    const options = getCookieOptions(req);
    res.set("Authorization", `Bearer ${accessToken}`);
    res.cookie("refreshToken", refreshToken, options);
    return { success: true, accessToken, refreshToken };
  }
  return false;
};

