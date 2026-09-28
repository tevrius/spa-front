import { queryOptions } from "@tanstack/react-query";
import { endpoints, http } from "@/shared/api";
import type { ChatMessage, ChatSummary } from "@/shared/types";

export type AskRequest = {
  message: string;
  location: string;
  budget_limit: number | null;
};

export const assistantApi = {
  history: () => http.get<ChatSummary[]>(endpoints.chat),
  examples: () => http.get<string[]>(endpoints.chatExamples),
  message: (id: string) => http.get<ChatMessage>(endpoints.chatMessage(id)),
  ask: (body: AskRequest) =>
    http.post<ChatMessage, AskRequest>(endpoints.chat, body),
};

export const assistantQueries = {
  history: () =>
    queryOptions({ queryKey: ["chat-history"], queryFn: assistantApi.history }),
  examples: () =>
    queryOptions({
      queryKey: ["chat-examples"],
      queryFn: assistantApi.examples,
    }),
  message: (id: string) =>
    queryOptions({
      queryKey: ["chat-message", id],
      queryFn: () => assistantApi.message(id),
    }),
};
