"use client"

import Link from "next/link"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function FloatingChatButton() {
  return (
    <Link href="/chat">
      <Button
        size="lg"
        className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        <MessageCircle className="mr-2 h-5 w-5" />
        Assistente
      </Button>
    </Link>
  )
}
