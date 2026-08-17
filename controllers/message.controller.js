import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";
import mongoose from "mongoose";
import { success } from "zod";

export const getMessage = async (req, res) => {
  try {
    const chatId = req.params?.chatId;
    const userId = req.tokenData?.id;

    const chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat)
      return res
        .status(404)
        .json({ message: "Chat not found.", success: false });

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });

    res.json({
      message: "Messages fetched.",
      data: messages,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { content, model = null } = req.body || {};
    const chatId = req.params?.chatId;

    if (!content || content.trim() == "") {
      return res.status(400).json({
        message: "Content not found. Provide content.",
        success: false,
      });
    }

    let chat;
    if (chatId) {
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({
          message: "ChatId is not a valid id.",
          success: false,
        });
      }
      chat = await Chat.findOne({
        _id: chatId,
        userId: req.tokenData.id,
      });
      if (!chat) {
        return res.status(404).json({
          message: "Chat not found",
          success: false,
        });
      }
    } else {
      if (!model) {
        return res.status(400).json({
          message: "Model not provided.",
          success: false,
        });
      }
      chat = await Chat.create({
        userId: req.tokenData.id,
        model,
      });
    }

    const Usermessage = await Message.create({
      userId: req.tokenData.id,
      chatId: chat._id,
      role: "user",
      content: content,
    });

    // content : AI ko bhejna.......

    const dummyResponse = "Abhi implement baki hai .....";

    const assistantMessage = await Message.create({
      userId: req.tokenData.id,
      chatId: chat._id,
      role: "assistant",
      content: dummyResponse,
    });
    chat.messageCount += 2;
    if (chat.topic.toLowerCase() === "new chat") {
      chat.topic = content.trim().slice(0, 40);
    }

    await chat.save();

    res.json({
      message: "Responce generated.",
      data: {
        chatId: chat._id,
        messageId: assistantMessage._id,
        role: assistantMessage.role,
        content: assistantMessage.content,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};
