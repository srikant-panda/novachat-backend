import { google } from "googleapis";
import crypto from "crypto";
import User from "../../models/user.model.js";
import { createUser } from "../../utils/userCreate.js";
import { sendTokens } from "../../utils/jwtAndCookie.utils.js";

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL,
);

export const googeleLoginHandler = async (req, res) => {
  const isAlrdyLogdin = req.tokenData || null;
  if (isAlrdyLogdin) {
    return res.json({
      message: "User already logged in.",
      success: true,
    });
  }
  const q = req.query;
  if (!q.redirect_url)
    return res
      .status(400)
      .json({ message: "no redirect url specified in query.", success: false });
  req.session.redirect_url = q.redirect_url;
  const state = crypto.randomBytes(32).toString("hex");
  req.session.state = state;
  const scpopes = ["openid", "profile", "email"];
  const authorizeURL = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scpopes,
    state: state,
    prompt: "consent",
  });
  res.redirect(authorizeURL);
};

export const googleCallbackHandler = async (req, res) => {
  const q = req.query;
  if (q.error) {
    // An error response e.g. error=access_denied
    console.log("Error:" + q.error);
    return res.json({ messgae: "login failed." });
  }
  if (q.state !== req.session.state) {
    console.log("State mismatch. Possible CSRF attack");
    return res.json({ message: "State mismatch. Possible CSRF attack" });
  }
  const { tokens } = await oauth2Client.getToken(q.code);
  console.log(tokens);
  const id_data = await oauth2Client.verifyIdToken({ idToken:tokens.id_token , audience:process.env.GOOGLE_CLIENT_ID });
  console.log(id_data);

  let user = await User.findOne({ email: id_data.payload.email });
  if (!user) {
    user = await createUser({
      name: id_data.payload.name,
      email: id_data.payload.email,
      method: "google",
      clientID: process.env.GOOGLE_CLIENT_ID,
    });
  }
  console.log(user);
  const result = await sendTokens(res, user);
  if (!result) {
    return res.status(403).json({ message: "login failed.", sucess: false });
  }
  const baseRedirect = req.session.redirect_url || "http://localhost:5173/auth/callback";
  const redirectUrl = result.accessToken
    ? `${baseRedirect}${baseRedirect.includes("?") ? "&" : "?"}token=${result.accessToken}`
    : baseRedirect;
  res.redirect(redirectUrl);
};
