import { OpenRouter } from "@openrouter/sdk";
import "dotenv/config";
import readline from "node:readline/promises";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const history = [];

export const openrouter_provider = async (context, prompt) => {
  const client = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const result = await client.chat.send({
    chatRequest: {
      model: "nvidia/nemotron-3.5-lightning:free",
      messages: [...context, prompt],
    },
  });

  // console.log(result.choices);
  return result.choices[0].message.content;
};

while (true) {
  const prompt_content = await rl.question("user> ");
  if(prompt_content === "exit") rl.close();
  const prompt = {
    role: "user",
    content: prompt_content,
  };
  history.push(prompt)

  const assistant_resonse = await openrouter_provider(history, prompt);
    history.push({
    role: "assistant",
    content: assistant_resonse,
  });
  console.log("assistant>",assistant_resonse);
}



