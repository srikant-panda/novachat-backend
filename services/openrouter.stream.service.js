import openRouter from "../config/openrouter.js";

/**
 * Streams an OpenRouter chat completion using the same SDK/configuration
 * as the existing non-streaming service.
 */
export async function generateAIResponseStream({
  model,
  messages,
  onToken,
  onUsage,
}) {
  const stream = await openRouter.chat.send({
    chatRequest: {
      model,
      messages,
      tools: [
        {
          type: "openrouter:web_search",
          parameters: {
            engine: "auto",
            max_results: 5,
            max_total_results: 20,
            search_context_size: "auto",
            allowed_domains: [],
            excluded_domains: [],
          },
        },
      ],
      stream: true,
    },
  });

  let result = "";
  let usage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };
  let buffer = "";
  for await (const chunk of stream) {
    const content = chunk.choices?.[0]?.delta?.content;
    // if(!content) return

    if (content) {
      result += content;
      // await onToken(content);
      buffer += content;

      // Flush when we reach a natural boundary
      if (
        buffer.length >= 80 ||
        buffer.includes("\n") ||
        buffer.endsWith(". ") ||
        buffer.endsWith("! ") ||
        buffer.endsWith("? ")
      ) {
        onToken(buffer);
        buffer = "";
      }

      // Don't lose remaining text
      // if (buffer) {
      //   onToken(buffer);
      // }
    }

    if (chunk.usage) {
      const promptTokens = chunk.usage.promptTokens || 0;
      const completionTokens = chunk.usage.completionTokens || 0;
      const totalTokens =
        chunk.usage.totalTokens || promptTokens + completionTokens;

      usage = {
        promptTokens,
        completionTokens,
        totalTokens,
      };
    }
  }

  if (!result) {
    throw new Error("Cannot get AI response.");
  }

  await onUsage(usage);
  return { result, usage };
}
