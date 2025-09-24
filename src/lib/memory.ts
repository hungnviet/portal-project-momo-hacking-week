import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const memoryStore = new Map<
  string,
  { messages: ChatCompletionMessageParam[]; context?: string }
>();

export function getMemory(sessionId: string): ChatCompletionMessageParam[] {
  return memoryStore.get(sessionId)?.messages || [];
}

export function getContext(sessionId: string): string | undefined {
  return memoryStore.get(sessionId)?.context;
}

export function setContext(sessionId: string, context: string) {
  const existing = memoryStore.get(sessionId) || { messages: [] };
  memoryStore.set(sessionId, { ...existing, context });
}

export function addMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
) {
  const existing = memoryStore.get(sessionId) || { messages: [] };
  const history = existing.messages;

  history.push({ role, content });

  // Keep last N messages
  const MAX_MEMORY = 6;
  memoryStore.set(sessionId, {
    ...existing,
    messages: history.slice(-MAX_MEMORY),
  });
}