export const chatTokenUsage = async ( chat,usage ) =>{
    chat.usage.promptTokens += usage?.promptTokens;
    chat.usage.completionTokens += usage?.completionTokens;
    chat.usage.totalTokens += usage?.totalTokens
    await chat.save();
    return true;
}