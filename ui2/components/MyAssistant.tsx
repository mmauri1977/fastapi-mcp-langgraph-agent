"use client";

import {
  type ChatModelAdapter,
  useLocalRuntime,
  unstable_useRemoteThreadListRuntime as useRemoteThreadListRuntime,
  useThreadListItem,
  AssistantRuntimeProvider,
  unstable_RemoteThreadListAdapter,
  ThreadHistoryAdapter,
  useLocalThreadRuntime,
  RuntimeAdapterProvider,
  ExportedMessageRepository
} from "@assistant-ui/react";
import { apiRequest, withAuth, withSession } from "@/lib/api"
import { useMemo, ReactNode } from "react";
import { v4 as uuidv4 } from 'uuid';

const MyModelAdapterAsync: ChatModelAdapter = {
  async *run({ messages, abortSignal }) {
    const stream = await apiRequest("/chatbot/chat/stream", withSession({
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [{
          role: messages[messages.length - 1].role,
          content: (() => {
            const content = messages[messages.length - 1].content[0];
            if (content.type === 'text') {
              return (content as { type: 'text', text: string }).text;
            }
            return '';
          })()
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



// Implement your custom adapter with proper message persistence
const myDatabaseAdapter: unstable_RemoteThreadListAdapter = {
  async list() {
    console.log("list");  
    const threads = await apiRequest("/auth/sessions", withAuth({
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies
    }))

    var response = await threads.json()
    var json= {
      threads: response.map((t) => ({
        status: "regular",
        remoteId: t.session_id,
        externalId: t.token.access_token,
        title: t.name,
      })),
    };
    return json;
  },
  async initialize(threadId) {
    console.log("initialize " + threadId);   
    const thread = await apiRequest("/auth/session", withAuth({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies
    }));
    const { token, session_id } = await thread.json()

    // Store token in localStorage for future requests
    localStorage.setItem("sessionToken", token.access_token)

    return { id: threadId, remoteId: session_id, externalId: token.access_token };
  },
  async rename(remoteId, newTitle) {
    console.log("rename");
    await apiRequest("/auth/session/"+remoteId+"/name", withAuth({
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        name: newTitle
      })
    }));
  },
  async archive(remoteId) {
    // TODO: not implemented
    console.log("archive");
  },
  async unarchive(remoteId) {
    // TODO: not implemented
    console.log("unarchive");
  },
  async delete(remoteId) {
    // TODO: not implemented
    console.log("delete");
  },
  async generateTitle(remoteId, messages) {
    console.log("generateTitle");
    const newTitle = messages[0].content[0].text.substring(0,30)
    
    await apiRequest("/auth/session/"+remoteId+"/name", withAuth({
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        name: newTitle
      })
    }));

    return new ReadableStream(); // Return empty stream
  },
};




export function MyAssistant({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
const runtime2 = useLocalRuntime(MyModelAdapterAsync);
const runtime = useRemoteThreadListRuntime({
    runtimeHook: () => {
      return useLocalThreadRuntime(MyModelAdapterAsync, {});
    },
    adapter: {
      ...myDatabaseAdapter,
      // The Provider component adds thread-specific adapters
      unstable_Provider: ({ children }) => {
        // This runs in the context of each thread
        const threadListItem = useThreadListItem();
        
        const remoteId = threadListItem.remoteId;
        const externalId = threadListItem.externalId;
        console.log("---"+remoteId+"---"+externalId)
        
        // Create thread-specific history adapter
        const history = useMemo<ThreadHistoryAdapter>(
          () => ({
            async load() {
              console.log("load " + remoteId);
              if (!remoteId) return { messages: [] };

              // Store token in localStorage for future requests
              localStorage.setItem("sessionToken", "" + externalId)

              const messagesResponse = await apiRequest("/chatbot/messages", withSession({
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "include", // Include cookies
              }));
              const { messages } = await messagesResponse.json();
              const response = ExportedMessageRepository.fromArray(messages.map((m) => ({
                  role: m.role,
                  content: m.content,
                  id: uuidv4(), // TODO: remove random Uuid
                  createdAt: new Date(m.createdAt)
                })))
              ;
              console.log(response);
              return response;
            },
            async append(message) {
              console.log("append " + remoteId);
              // No need to do this
            },
          }),
          [remoteId],
        );
        const adapters = useMemo(() => ({ history }), [history]);
        return (
          <RuntimeAdapterProvider adapters={adapters}>
            {children}
          </RuntimeAdapterProvider>
        );
      },
    },
  });
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}