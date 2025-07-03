"use client";

import { chooseCartFromComparison, confirmAction, createChatSession, getChatSession, sendMessageToChat } from "@/api";
import ChatMessage from "@/components/ChatMessage";
import ConversationSidebar from "@/components/ConversationSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatSessionPopulated } from "@/types";
import { History, Loader2, Plus, Send, Upload } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

export default function ChatPage() {
  const params = useSearchParams();
  const chatId = params.get("chatId");
  const chat = useSWR<ChatSessionPopulated>(`/api/chats/${chatId}`, () => getChatSession(chatId ? Number(chatId) : 0));
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.data?.messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;

    const getChatId = async () => {
      if (chatId) return Number(chatId);
      const response = await createChatSession();
      if (!response) {
        console.error("Erro ao criar chat");
        return null;
      }
      return response.id;
    };

    const thisChatId = await getChatId();
    if (!thisChatId) {
      console.error("Erro ao criar ou obter chat. Tente novamente mais tarde.");
      return;
    }

    setMessage("");
    setLoading(true);
    await sendMessageToChat(thisChatId, message);
    await chat.mutate();
    setLoading(false);
  };

  const handleApplyCart = async (cartId: number) => {
    setLoading(true);
    try {
      await chooseCartFromComparison(cartId);
      await mutate("/api/cart");
      toast.success("Carrinho aplicado com sucesso!");
    } catch (error) {
      console.error("Erro ao aplicar carrinho:", error);
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async () => {
    const response = await createChatSession();
    if (response) {
      window.history.pushState({}, "", `?chatId=${response.id}`);
    } else {
      console.error("Erro ao criar nova conversa");
    }
  };

  const handleConfirmAction = async (actionId: number, sessionId: number) => {
    setLoading(true);
    try {
      await confirmAction(actionId, sessionId);
      await chat.mutate();
    } catch (error) {
      console.error("Erro ao confirmar ação:", error);
    } finally {
      setLoading(false);
    }
  };

  const suggestedPrompts = [
    "Sugira uma receita fácil para o jantar",
    "Quero comparar preços de ingredientes",
    "Busque produtos de massa",
    "Como fazer um risotto?",
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Conversation Sidebar */}
      <ConversationSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Chat Area */}
      <div
        className={`
          flex flex-col h-screen w-full pt-16 lg:pt-0 transition-all duration-300 ease-in-out
          ${sidebarOpen ? "lg:mr-80" : "mr-0"}
        `}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assistente</h1>
            </div>

            <div className="flex items-center space-x-3">
              {!chat.data && !chat.isLoading && (
                <Button onClick={() => createNewConversation()} className="hidden lg:block">
                  <Plus className="h-4 w-4 mr-2" />
                </Button>
              )}

              <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="relative">
                <History className="h-4 w-4" />
                {/* Badge for conversation count */}
                {/* {conversations.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {conversations.length}
                  </span>
                )} */}
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!chat.data && !chat.isLoading ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Olá! Sou seu assistente culinário</h2>
              <p className="text-gray-600 mb-6">Inicie uma nova conversa para começar!</p>

              <Button onClick={createNewConversation} size="lg">
                Iniciar Nova Conversa
              </Button>
            </div>
          ) : chat.data && chat.data.messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Como posso te ajudar hoje?</h2>
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
          ) : (
            chat.data &&
            chat.data.messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onConfirmAction={(actionId) => handleConfirmAction(actionId, chat.data!.id)}
                onApplyCart={handleApplyCart}
              />
            ))
          )}

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
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              title="Upload PDF"
            >
              <Upload className="h-4 w-4" />
            </Button>

            <Input
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={loading}
              className="flex-1"
            />

            <Button onClick={handleSendMessage} disabled={loading || !message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
