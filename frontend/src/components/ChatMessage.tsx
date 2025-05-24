"use client"

import type { ChatMessage as ChatMessageType, Recipe, Product } from "@/lib/types"
import { Bot, User, Clock, Users, Star, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ChatMessageProps {
  message: ChatMessageType
  onAddToCart?: (productId: string) => void
  onCreateCartFromRecipe?: (recipe: Recipe) => void
  onApplyCart?: (storeId: string, recipeId: string) => void
}

export default function ChatMessage({ message, onAddToCart, onCreateCartFromRecipe, onApplyCart }: ChatMessageProps) {
  const isUser = message.sender === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-xs lg:max-w-md ${isUser ? "order-2" : "order-1"}`}>
        <div className={`px-4 py-2 rounded-lg ${isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}>
          <div className="flex items-center space-x-2 mb-1">
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            <span className="text-xs opacity-75">{message.timestamp.toLocaleTimeString()}</span>
          </div>
          <p className="text-sm">{message.content}</p>
        </div>

        {/* Recipe Card */}
        {message.type === "recipe" && message.data && (
          <Card className="mt-3">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{message.data.title}</h3>
                  <p className="text-sm text-gray-600">{message.data.description}</p>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{message.data.prepTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{message.data.servings} porções</span>
                  </div>
                  <Badge
                    variant={
                      message.data.difficulty === "easy"
                        ? "default"
                        : message.data.difficulty === "medium"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {message.data.difficulty === "easy"
                      ? "Fácil"
                      : message.data.difficulty === "medium"
                        ? "Médio"
                        : "Difícil"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Ingredientes:</p>
                  <div className="flex flex-wrap gap-1">
                    {message.data.ingredients.slice(0, 3).map((ingredient: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {ingredient}
                      </span>
                    ))}
                    {message.data.ingredients.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{message.data.ingredients.length - 3} mais
                      </span>
                    )}
                  </div>
                </div>

                <Button size="sm" className="w-full" onClick={() => onCreateCartFromRecipe?.(message.data)}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Montar Carrinho
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Suggestions */}
        {message.type === "product_suggestion" && message.data && (
          <div className="mt-3 space-y-2">
            {message.data.map((product: Product) => (
              <Card key={product.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{product.name}</h4>
                      <p className="text-xs text-gray-500">{product.store.name}</p>
                      <p className="text-sm font-bold text-green-600">R$ {product.price.toFixed(2)}</p>
                    </div>
                    <Button size="sm" onClick={() => onAddToCart?.(product.id)} disabled={!product.inStock}>
                      {product.inStock ? "Adicionar" : "Indisponível"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Cart Comparison */}
        {message.type === "cart_comparison" && message.data && (
          <div className="mt-3 space-y-3">
            <h4 className="font-medium text-sm">Comparação para: {message.data.recipe.title}</h4>
            {message.data.carts.map((cart: any, index: number) => (
              <Card key={cart.store.id} className={index === 0 ? "border-green-500 border-2" : ""}>
                <CardContent className="p-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{cart.store.logo}</span>
                        <div>
                          <h5 className="font-medium text-sm">{cart.store.name}</h5>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-gray-500">{cart.store.rating}</span>
                          </div>
                        </div>
                      </div>
                      {index === 0 && <Badge className="bg-green-500">Melhor opção</Badge>}
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Disponibilidade: {cart.availability.toFixed(0)}%</span>
                      <span className="font-bold text-green-600">R$ {cart.total.toFixed(2)}</span>
                    </div>

                    <div className="text-xs text-gray-500">
                      {cart.items.length} de {message.data.recipe.ingredients.length} ingredientes
                    </div>

                    <Button
                      size="sm"
                      className="w-full"
                      variant={index === 0 ? "default" : "outline"}
                      onClick={() => onApplyCart?.(cart.store.id, message.data.recipe.id)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Aplicar este carrinho
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
