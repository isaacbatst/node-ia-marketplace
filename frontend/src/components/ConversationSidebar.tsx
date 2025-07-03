"use client";

import { createChatSession, getChatSession, getChatSessions } from "@/api";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatSession, ChatSessionPopulated } from "@/types";
import { MessageCircle, MoreVertical, Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";

interface ConversationSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function ConversationSidebar({ isOpen, onToggle }: ConversationSidebarProps) {
  const chats = useSWR<ChatSession[]>("/api/chats", () => getChatSessions());
  const chatId = useSearchParams().get("chatId");
  const chat = useSWR<ChatSessionPopulated>(`/api/chats/${chatId}`, () => getChatSession(chatId ? Number(chatId) : 0));

  const handleSelectConversation = (conversationId: number) => {
    window.history.pushState({}, "", `?chatId=${conversationId}`);
  };

  const formatDate = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString("pt-BR", { weekday: "short" });
    } else {
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    }
  };

  const createChat = async () => {
    const response = await createChatSession();
    if (!response) {
      console.error("Erro ao criar chat");
      return;
    }
    window.history.pushState({}, "", `?chatId=${response.id}`);
    await chats.mutate();
    onToggle();
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-[#0005] z-40" onClick={onToggle} />}

      {/* Sidebar - Right side */}
      <div
        className={`
          fixed top-0 right-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg
          transform transition-transform duration-300 ease-in-out z-50
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 pt-20 lg:pt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Histórico</h2>
              {chat.data && (
                <Button size="sm" onClick={() => createChat()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova
                </Button>
              )}
            </div>

            {/* New Conversation Button - Only show when no conversation is selected */}
            {!chat.data && (
              <Button onClick={() => createChat()} className="w-full" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Iniciar Nova Conversa
              </Button>
            )}
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {chats.data?.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation.id)}
                  className={`
                    group relative p-3 rounded-lg cursor-pointer transition-colors
                    ${chat.data?.id === conversation.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <MessageCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {conversation.messages.length > 0
                            ? conversation.messages[0].content.slice(0, 30)
                            : "Nova conversa"}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">{conversation.messages.length} mensagens</p>
                        <span className="text-xs text-gray-400">{formatDate(conversation.created_at)}</span>
                      </div>

                      {/* Last message preview */}
                      {conversation.messages.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {conversation.messages[conversation.messages.length - 1].content.slice(0, 40)}
                        </p>
                      )}
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                    </DropdownMenu>
                  </div>
                </div>
              ))}

              {chats.data && chats.data.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma conversa salva</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <p>💡 Suas conversas são salvas automaticamente</p>
              <p>🗑️ Use o menu ⋮ para deletar conversas</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
