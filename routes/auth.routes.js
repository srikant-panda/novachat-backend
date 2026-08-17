import { Router } from "express"; 
import * as authController from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";


const authRouter = Router();

authRouter.post("/signup",authController.signupController);
authRouter.post("/login",authMiddleware({ optionalAuth:true }),authController.loginController);
authRouter.post("/logout",authMiddleware({ type:"refresh" }),authController.logoutCotroller);
authRouter.post("/refresh",authMiddleware({ type:"refresh" }),authController.refreshController);

export default authRouter;