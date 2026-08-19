export const resetTokenUsageIfNeeded = async (user) => {
  const now = new Date();

  if (now > user.usage.resetAt) {
    user.usage.tokenUsed = 0;
    user.usage.resetAt = new Date(Date.now() + 5 * 60 * 60 * 1000);
    await user.save();
  }
};

export const isUsageLimitExceeded = (user) => {
  return user.usage.tokenUsed >= user.usage.tokenLimit
};

export const  updateUserTokenUsage = async (user , usage) =>{      // Here we add the each message total token.
  user.usage.tokenUsed += usage?.totalTokens;
  user.usage.totalTokenUsed += usage?.totalTokens;
  await user.save();
  return true
}

