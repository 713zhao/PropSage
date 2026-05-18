import { create } from 'zustand'

export interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

interface ChatState {
  messages: ChatMessage[]
  addMessage: (msg: ChatMessage) => void
  clearHistory: () => void
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  clearHistory: () => set({ messages: [] }),
}))
