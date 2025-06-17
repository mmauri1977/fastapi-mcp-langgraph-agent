"use client";

import { Thread } from "@/components/assistant-ui/thread";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { apiRequest, apiUrlEncodedRequest, withAuth } from "@/lib/api"


const MyModelAdapterAsync: ChatModelAdapter = {
  async *run({ messages, abortSignal, context }) {
    const stream = await apiRequest("/chatbot/chat/stream", withAuth({
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [{
          role: messages[messages.length - 1].role,
          content: messages[messages.length - 1].content[0].text
        }]
      }),
      // if the user hits the "cancel" button or escape keyboard key, cancel the request
      signal: abortSignal,
    }));
    let text = "";
    const reader = stream.body!.getReader();
    const decoder = new TextDecoder("utf-8");

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              text += data.content || "";
              yield {
                content: [{ type: "text", text }],
              };
            } catch (e) {
              console.error('Error parsing JSON:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};


export function MyAssistant() {
  const runtime = useLocalRuntime(MyModelAdapterAsync);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread />
    </AssistantRuntimeProvider>
    
  );
}
