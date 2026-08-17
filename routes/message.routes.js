import { Router } from "express"; 
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getMessage,sendMessage } from "../controllers/message.controller.js";


const messageRouter = Router();

/**
 * 1- getMessage
 * 2- sendMessage
 */


messageRouter.get("/:chatId",authMiddleware(),getMessage);
messageRouter.post("/:chatId",authMiddleware(),sendMessage);
messageRouter.post("/",authMiddleware(),sendMessage)

export default messageRouter;