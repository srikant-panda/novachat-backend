import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import fs from "fs";

const ai = new GoogleGenAI({});

const interaction = await ai.interactions.create({
  model: "gemini-3.6-flash",
  input: "Who is ",
});



