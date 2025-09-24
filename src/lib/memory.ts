// lib/memory.ts
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const memoryStore = new Map<string, ChatCompletionMessageParam[]>();

export function getMemory(sessionId: string): ChatCompletionMessageParam[] {
  return memoryStore.get(sessionId) || [];
}

export function addMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
) {
  const history = memoryStore.get(sessionId) || [];
  history.push({ role, content }); // ✅ Now matches ChatCompletionMessageParam

  // Keep last N messages
  const MAX_MEMORY = 6;
  memoryStore.set(sessionId, history.slice(-MAX_MEMORY));
}
