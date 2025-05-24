import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Sidebar from "@/components/Sidebar"
import { AppProvider } from "@/contexts/AppContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Grocery AI - Marketplace Inteligente",
  description: "Marketplace de supermercado com assistente de IA para receitas e comparação de preços",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AppProvider>
          <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 overflow-auto lg:ml-0">
              <div className="lg:pl-0 pl-0">{children}</div>
            </main>
          </div>
        </AppProvider>
      </body>
    </html>
  )
}
