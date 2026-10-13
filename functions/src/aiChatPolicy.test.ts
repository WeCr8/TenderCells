import { AI_CHAT_LIMITS, sanitizeAiChat } from "./aiChatPolicy";

const ok = (v: ReturnType<typeof sanitizeAiChat>) => {
  if ("error" in v) throw new Error(v.error);
  return v;
};

describe("aiChat request policy", () => {
  it("drops the app's leading greeting so the conversation opens with the user", () => {
    const v = ok(sanitizeAiChat({ messages: [{ role: "assistant", content: "Hi!" }, { role: "user", content: "Why is ammonia high?" }] }));
    expect(v.messages).toEqual([{ role: "user", content: "Why is ammonia high?" }]);
  });

  it("keeps only the most recent turns", () => {
    const many = Array.from({ length: 51 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: `m${i}` }));
    const v = ok(sanitizeAiChat({ messages: many }));
    expect(v.messages.length).toBeLessThanOrEqual(AI_CHAT_LIMITS.maxMessages);
    expect(v.messages[0].role).toBe("user");
    expect(v.messages[v.messages.length - 1].content).toBe("m50");
  });

  it("caps tokens and system prompt size", () => {
    const v = ok(sanitizeAiChat({ system: "x".repeat(10_000), max_tokens: 99_999, messages: [{ role: "user", content: "hi" }] }));
    expect(v.max_tokens).toBe(AI_CHAT_LIMITS.maxTokens);
    expect(v.system.length).toBe(AI_CHAT_LIMITS.maxSystemChars);
    expect(ok(sanitizeAiChat({ messages: [{ role: "user", content: "hi" }] })).max_tokens).toBe(AI_CHAT_LIMITS.defaultTokens);
  });

  it("refuses bad shapes, oversized messages and a non-user last turn", () => {
    expect(sanitizeAiChat({})).toHaveProperty("error");
    expect(sanitizeAiChat({ messages: [{ role: "system", content: "x" }] })).toHaveProperty("error");
    expect(sanitizeAiChat({ messages: [{ role: "user", content: 5 }] })).toHaveProperty("error");
    expect(sanitizeAiChat({ messages: [{ role: "user", content: "x".repeat(AI_CHAT_LIMITS.maxChars + 1) }] })).toHaveProperty("error");
    expect(sanitizeAiChat({ messages: [{ role: "user", content: "q" }, { role: "assistant", content: "a" }] })).toHaveProperty("error");
  });
});
