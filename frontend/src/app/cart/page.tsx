"use client"

import { useEffect } from "react"
import { useApp } from "@/contexts/AppContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Trash2, Star, Plus, Minus } from "lucide-react"
import { getCurrentCart, removeFromCart } from "@/lib/mockBackend"

export default function CartPage() {
  const { currentCart, setCurrentCart } = useApp()

  useEffect(() => {
    getCurrentCart().then(setCurrentCart)
  }, [setCurrentCart])

  const handleRemoveItem = async (itemId: string) => {
    try {
      const updatedCart = await removeFromCart(itemId)
      setCurrentCart(updatedCart)
    } catch (error) {
      console.error("Erro ao remover item:", error)
    }
  }

  if (!currentCart || currentCart.items.length === 0) {
    return (
      <div className="p-6 pt-20 lg:pt-6">
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Carrinho vazio</h3>
          <p className="mt-1 text-sm text-gray-500">Adicione produtos através da busca ou converse com o assistente</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 pt-20 lg:pt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Meu Carrinho</h1>
        <p className="text-gray-600 mt-2">Revise seus itens antes de finalizar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-lg">{currentCart.store.logo}</span>
                <div>
                  <span>{currentCart.store.name}</span>
                  <div className="flex items-center space-x-1 mt-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-gray-500">{currentCart.store.rating}</span>
                    <span className="text-sm text-gray-500">• {currentCart.store.deliveryTime}</span>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentCart.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <img
                      src={item.product.image || "/placeholder.svg"}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />

                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">{item.product.description}</p>
                      <p className="text-sm font-medium text-green-600">
                        R$ {item.product.price.toFixed(2)} por {item.product.unit}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-gray-900">R$ {(item.product.price * item.quantity).toFixed(2)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">R$ {currentCart.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa de entrega:</span>
                  <span className="font-medium">R$ 5,90</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>R$ {(currentCart.total + 5.9).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>• {currentCart.items.length} itens no carrinho</p>
                <p>• Entrega em {currentCart.store.deliveryTime}</p>
                <p>• Avaliação da loja: {currentCart.store.rating}⭐</p>
              </div>

              <Button className="w-full" size="lg">
                Finalizar Pedido
              </Button>

              <Button variant="outline" className="w-full">
                Continuar Comprando
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
