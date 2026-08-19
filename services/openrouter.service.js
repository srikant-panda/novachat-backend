import openRouter from "../config/openrouter.js";
// import readline from "node:readline/promises";

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

export const generateAIResponse = async ({ model, messages }) => {
  const completion = await openRouter.chat.send({
    chatRequest: {
      model: model,
      messages: messages,
    },
  });
  const result = completion.choices[0].message.content;
  if (!result) {
    throw new Error("Cannot get AI response.");
  }
  const promptTokens = completion.usage?.promptTokens || 0;
  const completionTokens = completion.usage?.completionTokens || 0;
  return {
    result,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    },
  };
};

// const history = [];
// let totalTokens = 0;
// let promptTokens = 0;
// let completionTokens = 0;

// while (true) {
//   try {
//     const content = await rl.question(`user----> 
  
//   `);

//     // const model = "~openai/gpt-latest";
//     const model = "nvidia/nemotron-3-nano-30b-a3b:free";
//     const userPrompt = {
//       role: "user",
//       content,
//     };

//     const aiResponse = await generateAIResponse({
//       model,
//       messages: [...history, userPrompt],
//     });
//     console.log(`assistant----->
//     ${aiResponse.result}
//     `);
//     totalTokens += aiResponse.usage.totalTokens;
//     promptTokens += aiResponse.usage.promptTokens;
//     completionTokens += aiResponse.usage.completionTokens;
//     history.push(userPrompt);
//     history.push({ role: "assistant", content: aiResponse.result });
//   } catch (err) {
//     console.log(err);
//     rl.close();
//     break;
//   }
// }

// console.log({
//   promptTokens,
//   completionTokens,
//   totalTokens,
// });
