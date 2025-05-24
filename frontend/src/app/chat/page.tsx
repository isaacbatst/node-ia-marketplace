"use client"

import { useState } from "react"
import { useApp } from "@/contexts/AppContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Send, Bot, User } from "lucide-react"
import { sendChatMessage, executeAction } from "@/lib/mockBackend"
import type { ChatMessage } from "@/lib/types"

export default function ChatPage() {
  const { chatMessages, addChatMessage } = useApp()
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!message.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      sender: "user",
      timestamp: new Date(),
    }

    addChatMessage(userMessage)
    setMessage("")
    setLoading(true)

    try {
      const assistantResponse = await sendChatMessage(message)
      addChatMessage(assistantResponse)
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (actionType: string, payload: any) => {
    setLoading(true)
    try {
      const result = await executeAction(actionType, payload)

      const confirmationMessage: ChatMessage = {
        id: Date.now().toString(),
        content: result.message || "Ação executada com sucesso!",
        sender: "assistant",
        timestamp: new Date(),
      }

      addChatMessage(confirmationMessage)
    } catch (error) {
      console.error("Erro ao executar ação:", error)
    } finally {
      setLoading(false)
    }
  }

  const suggestedPrompts = [
    "Deseja montar um carrinho com base em sua última receita?",
    "Que tal otimizar suas compras para economizar tempo?",
    "Posso sugerir ingredientes complementares para suas receitas?",
    "Quer que eu analise seu plano alimentar da semana?",
  ]

  return (
    <div className="p-6 pt-20 lg:pt-6 h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Assistente de Compras</h1>
        <p className="text-gray-600 mt-2">Converse com a IA para otimizar suas compras</p>
      </div>

      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <span>Chat</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-96">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">Olá! Sou seu assistente de compras. Como posso ajudar?</p>
                  <div className="space-y-2">
                    {suggestedPrompts.map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setMessage(prompt)}
                        className="block mx-auto"
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.sender === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      <span className="text-xs opacity-75">{msg.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm">{msg.content}</p>

                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.actions.map((action) => (
                          <Button
                            key={action.id}
                            size="sm"
                            variant="secondary"
                            onClick={() => handleAction(action.type, action.payload)}
                            className="w-full text-xs"
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4" />
                      <span className="text-sm">Assistente está digitando...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex space-x-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={loading}
              />
              <Button onClick={handleSendMessage} disabled={loading || !message.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
