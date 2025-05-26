"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import useSWR from "swr";
import { getCart, removeCartItem, updateCartItemQuantity } from "../../api";
import { Cart } from "@/types";

export default function CartPage() {
  const cart = useSWR<Cart>("/api/cart", () => getCart());

  const handleRemoveItem = async (itemId: number) => {
    try {
      if (!cart.data) return;
      await cart.mutate(
        async (current) => {
          if (!current) return current;
          await removeCartItem(current.id, itemId);
          return {
            ...current,
            items: current.items.filter((item) => item.id !== itemId),
          };
        },
        {
          rollbackOnError: true,
          optimisticData: (current) => {
            return {
              ...current!,
              items: current!.items.filter((item) => item.id !== itemId),
            };
          },
        }
      );
    } catch (error) {
      console.error("Erro ao remover item:", error);
    }
  };

  const handleClickUpdateItem = async (itemId: number, quantity: number) => {
    if (!cart.data) return;
    try {
      await cart.mutate(
        async (current) => {
          if (!current) return current;
          await updateCartItemQuantity(current.id, itemId, quantity);
          return {
            ...current,
            items: current.items.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
          };
        },
        {
          rollbackOnError: true,
          optimisticData: (current) => {
            return {
              ...current!,
              items: current!.items.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
            };
          },
        }
      );
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
    }
  };

  if (!cart.data || cart.data.items.length === 0) {
    return (
      <div className="p-6 pt-20 lg:pt-6">
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Carrinho vazio</h3>
          <p className="mt-1 text-sm text-gray-500">Adicione produtos através da busca ou converse com o assistente</p>
        </div>
      </div>
    );
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
                <div>
                  <span>{cart.data.store.name}</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cart.data.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (item.quantity > 1) {
                            handleClickUpdateItem(item.id, item.quantity - 1);
                          } else {
                            handleRemoveItem(item.id);
                          }
                        }}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          handleClickUpdateItem(item.id, item.quantity + 1);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-gray-900">R$ {((item.price / 100) * item.quantity).toFixed(2)}</p>
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
                  <span className="font-medium">R$ {(cart.data.total / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa de entrega:</span>
                  <span className="font-medium">R$ 5,90</span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>• {cart.data.items.length} itens no carrinho</p>
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
  );
}
