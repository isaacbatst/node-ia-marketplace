"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import type { Cart, ChatMessage } from "@/lib/types"

interface AppContextType {
  currentCart: Cart | null
  chatMessages: ChatMessage[]
  setCurrentCart: (cart: Cart | null) => void
  addChatMessage: (message: ChatMessage) => void
  clearChat: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentCart, setCurrentCart] = useState<Cart | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  const addChatMessage = (message: ChatMessage) => {
    setChatMessages((prev) => [...prev, message])
  }

  const clearChat = () => {
    setChatMessages([])
  }

  return (
    <AppContext.Provider
      value={{
        currentCart,
        chatMessages,
        setCurrentCart,
        addChatMessage,
        clearChat,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
