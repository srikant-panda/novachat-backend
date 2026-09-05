import jwt from "jsonwebtoken";
import Session from "../../models/auth.model.js";

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

export const cookieOptions = {
  httpOnly: true,
  sameSite: config.PRODUCTION ? "none" : "lax",
  secure: config.PRODUCTION,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const sendTokens = async (res, user) => {
  const { tokens: accessToken, JTI: accessTokenJti } = createToken(
    user._id,
    user.email,
    "15m",
  );
  const { tokens: refreshToken, JTI: refreshTokenJTI } = createToken(
    user._id,
    user.email,
    "7d",
  );

  const isStored = await Session.create({
    JTI: refreshTokenJTI,
    owner: user._id,
  });
  if (isStored) {
    res.set("Authorization", accessToken);
    res.cookie("refreshToken", refreshToken, cookieOptions);
    return true;
  }
  return false;
};
