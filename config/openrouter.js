import { OpenRouter } from "@openrouter/sdk";
import { config } from "./config.js";


const openRouter = new OpenRouter({
    apiKey: config.OPENROUTER_API_KEY,
});

export default openRouter;