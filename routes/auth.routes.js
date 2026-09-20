import { Router } from "express"; 
import * as authController from "../controllers/auth.controller.js";
import provider from "../controllers/provider-export.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { codeExchangeController } from "../controllers/mobileCodeExchange.js"
const authRouter = Router();

authRouter.post("/signup",authController.signupController);
authRouter.post("/login",authMiddleware({ optionalAuth:true }),authController.loginController);
authRouter.post("/logout",authMiddleware({ type:"refresh" }),authController.logoutCotroller);
authRouter.post("/refresh",authMiddleware({ type:"refresh" }),authController.refreshController);
authRouter.get("/login/google",authMiddleware({ optionalAuth:true }),provider.google.handler);
authRouter.put("/completeAuth",authMiddleware(),authController.completeAuth)
authRouter.get("/login/google/callback",provider.google.callback)
authRouter.get("/mobile/code", codeExchangeController);
authRouter.post("/mobile/code", codeExchangeController);
authRouter.get("/code", codeExchangeController);
authRouter.post("/code", codeExchangeController);

export default authRouter;