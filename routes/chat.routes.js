// getRecentChats  : Top 20

//getSingleChat

//createChat

//deleteChat


import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getRecentChat,getChatById,deleteChatByID,createChat }  from "../controllers/chat.controller.js";

const chatRouter = Router();
chatRouter.use(authMiddleware())

chatRouter.get("/getRecentChat",authMiddleware(),getRecentChat );
chatRouter.post("/createChat",authMiddleware(),createChat);
chatRouter.get("/:chatId",authMiddleware(),getChatById);
chatRouter.delete("/:chatId",authMiddleware(),deleteChatByID);

export default chatRouter;