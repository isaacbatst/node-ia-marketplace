"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useApp } from "@/contexts/AppContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2, Upload } from "lucide-react"
import ChatMessage from "@/components/ChatMessage"
import {
  processAIMessage,
  addToCart,
  clearCartAndAdd,
  generateCartFromRecipe,
  getCurrentCart,
  applyCartFromComparison,
  uploadRecipeFile,
} from "@/lib/mockBackend"
import type { ChatMessage as ChatMessageType, Recipe } from "@/lib/types"

export default function ChatPage() {
  const { chatMessages, addChatMessage, currentCart, setCurrentCart } = useApp()
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [showConflictDialog, setShowConflictDialog] = useState<{
    show: boolean
    productId: string
    conflictStore: string
  }>({ show: false, productId: "", conflictStore: "" })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  // Adicione um ref para o input de arquivo
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  useEffect(() => {
    // Load current cart on mount
    getCurrentCart().then(setCurrentCart)
  }, [setCurrentCart])

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      content: message,
      sender: "user",
      timestamp: new Date(),
    }

    addChatMessage(userMessage)
    setMessage("")
    setLoading(true)

    try {
      const assistantResponse = await processAIMessage(message)
      addChatMessage(assistantResponse)
    } catch (error) {
      console.error("Erro ao processar mensagem:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (productId: string) => {
    try {
      const result = await addToCart(productId)

      if (result.conflict) {
        setShowConflictDialog({
          show: true,
          productId,
          conflictStore: result.conflictStore || "",
        })
        return
      }

      if (result.success && result.cart) {
        setCurrentCart(result.cart)

        const confirmationMessage: ChatMessageType = {
          id: Date.now().toString(),
          content: "Produto adicionado ao carrinho com sucesso! 🛒",
          sender: "assistant",
          timestamp: new Date(),
        }
        addChatMessage(confirmationMessage)
      }
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error)
    }
  }

  const handleConflictConfirm = async () => {
    try {
      const result = await clearCartAndAdd(showConflictDialog.productId)

      if (result.success && result.cart) {
        setCurrentCart(result.cart)

        const confirmationMessage: ChatMessageType = {
          id: Date.now().toString(),
          content: "Carrinho anterior removido e novo produto adicionado! 🛒",
          sender: "assistant",
          timestamp: new Date(),
        }
        addChatMessage(confirmationMessage)
      }
    } catch (error) {
      console.error("Erro ao substituir carrinho:", error)
    } finally {
      setShowConflictDialog({ show: false, productId: "", conflictStore: "" })
    }
  }

  const handleCreateCartFromRecipe = async (recipe: Recipe) => {
    setLoading(true)

    try {
      const comparison = await generateCartFromRecipe(recipe)

      const comparisonMessage: ChatMessageType = {
        id: Date.now().toString(),
        content: `Analisei todas as lojas para a receita "${recipe.title}". Aqui está a comparação:`,
        sender: "assistant",
        timestamp: new Date(),
        type: "cart_comparison",
        data: comparison,
      }

      addChatMessage(comparisonMessage)
    } catch (error) {
      console.error("Erro ao gerar comparação:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyCart = async (storeId: string, recipeId: string) => {
    setLoading(true)

    try {
      const newCart = await applyCartFromComparison(storeId, recipeId)
      setCurrentCart(newCart)

      const confirmationMessage: ChatMessageType = {
        id: Date.now().toString(),
        content: `Carrinho aplicado com sucesso! ${newCart.items.length} itens de ${newCart.store.name} foram adicionados. 🛒`,
        sender: "assistant",
        timestamp: new Date(),
      }
      addChatMessage(confirmationMessage)
    } catch (error) {
      console.error("Erro ao aplicar carrinho:", error)

      const errorMessage: ChatMessageType = {
        id: Date.now().toString(),
        content: "Erro ao aplicar carrinho. Tente novamente.",
        sender: "assistant",
        timestamp: new Date(),
      }
      addChatMessage(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Adicione a função de upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      alert("Por favor, selecione apenas arquivos PDF")
      return
    }

    setLoading(true)
    try {
      await uploadRecipeFile(file)

      const confirmationMessage: ChatMessageType = {
        id: Date.now().toString(),
        content: `Arquivo "${file.name}" enviado com sucesso! 📄 Agora posso te ajudar com receitas baseadas neste arquivo.`,
        sender: "assistant",
        timestamp: new Date(),
      }
      addChatMessage(confirmationMessage)
    } catch (error) {
      console.error("Erro no upload:", error)
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const suggestedPrompts = [
    "Sugira uma receita fácil para o jantar",
    "Quero comparar preços de ingredientes",
    "Busque produtos de massa",
    "Como fazer um risotto?",
  ]

  return (
    <div className="flex flex-col h-screen pt-16 lg:pt-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold text-gray-900">Assistente de Compras</h1>
        <p className="text-gray-600">Seu chef pessoal e comparador de preços</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Olá! Sou seu assistente culinário</h2>
            <p className="text-gray-600 mb-6">Posso te ajudar com receitas, buscar produtos e comparar preços!</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md mx-auto">
              {suggestedPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage(prompt)}
                  className="text-left justify-start"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onAddToCart={handleAddToCart}
            onCreateCartFromRecipe={handleCreateCartFromRecipe}
            onApplyCart={handleApplyCart}
          />
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Assistente está pensando...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={loading}
            className="flex-1"
          />
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={loading}>
            <Upload className="h-4 w-4" />
          </Button>
          <Button onClick={handleSendMessage} disabled={loading || !message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conflict Dialog */}
      {showConflictDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Conflito de Lojas</h3>
            <p className="text-gray-600 mb-6">
              Você já tem produtos de "{showConflictDialog.conflictStore}" no carrinho. Deseja remover o carrinho atual
              e adicionar este produto de outra loja?
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowConflictDialog({ show: false, productId: "", conflictStore: "" })}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button onClick={handleConflictConfirm} className="flex-1">
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
