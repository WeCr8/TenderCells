// aiChatPolicy.ts - what the aiChat callable will forward to Claude (unit tested).
//
// aiChat is a signed-in-only proxy that spends the project's Anthropic key. FIX(2026-10-12):
// it forwarded any system prompt and any number/size of messages, so one account could run
// up the bill, and the app's greeting (an assistant turn first) made Claude reject the call.

export const AI_CHAT_LIMITS = { maxMessages: 20, maxChars: 4000, maxSystemChars: 4000, maxTokens: 1000, defaultTokens: 500 };

export interface AiChatTurn { role: "user" | "assistant"; content: string }
export interface AiChatPayload { system: string; messages: AiChatTurn[]; max_tokens: number }

/**
 * Validate and trim an aiChat request.
 *
 * @param data - The callable's raw `data`
 * @returns The payload to send, or an error message for invalid-argument
 */
export function sanitizeAiChat(data: unknown): AiChatPayload | { error: string } {
  const d = (data ?? {}) as { system?: unknown; messages?: unknown; max_tokens?: unknown };
  if (!Array.isArray(d.messages) || d.messages.length === 0) return { error: "messages array is required" };
  const turns: AiChatTurn[] = [];
  for (const m of d.messages as Array<{ role?: unknown; content?: unknown }>) {
    if ((m?.role !== "user" && m?.role !== "assistant") || typeof m.content !== "string") {
      return { error: "each message needs role user|assistant and string content" };
    }
    const content = m.content.trim();
    if (!content) continue;
    if (content.length > AI_CHAT_LIMITS.maxChars) return { error: `a message is longer than ${AI_CHAT_LIMITS.maxChars} characters` };
    turns.push({ role: m.role, content });
  }
  // Most recent turns only, and the conversation must open with the person (Claude API rule).
  let messages = turns.slice(-AI_CHAT_LIMITS.maxMessages);
  while (messages.length && messages[0].role !== "user") messages = messages.slice(1);
  if (!messages.length || messages[messages.length - 1].role !== "user") return { error: "the last message must be from the user" };
  const system = typeof d.system === "string" ? d.system.slice(0, AI_CHAT_LIMITS.maxSystemChars) : "";
  const asked = typeof d.max_tokens === "number" && Number.isFinite(d.max_tokens) ? Math.floor(d.max_tokens) : AI_CHAT_LIMITS.defaultTokens;
  const max_tokens = Math.max(1, Math.min(asked, AI_CHAT_LIMITS.maxTokens));
  return { system, messages, max_tokens };
}
