"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, ShoppingCart, Star } from "lucide-react"
import { searchProducts, addToCart, clearCartAndAdd, getCurrentCart } from "@/lib/mockBackend"
import { mockStores } from "@/lib/mockData"
import { useApp } from "@/contexts/AppContext"
import type { Product } from "@/lib/types"

export default function ProductsPage() {
  const { currentCart, setCurrentCart } = useApp()
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStore, setSelectedStore] = useState<string>("all")
  const [loading, setLoading] = useState(false)
  const [showConflictDialog, setShowConflictDialog] = useState<{
    show: boolean
    productId: string
    conflictStore: string
  }>({ show: false, productId: "", conflictStore: "" })

  useEffect(() => {
    getCurrentCart().then(setCurrentCart)
  }, [setCurrentCart])

  useEffect(() => {
    if (searchTerm) {
      handleSearch()
    } else {
      setProducts([])
    }
  }, [searchTerm, selectedStore])

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setLoading(true)
    try {
      const results = await searchProducts(searchTerm, selectedStore === "all" ? undefined : selectedStore)
      setProducts(results)
    } catch (error) {
      console.error("Erro na busca:", error)
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
        alert("Produto adicionado ao carrinho!")
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
        alert("Carrinho anterior removido e novo produto adicionado!")
      }
    } catch (error) {
      console.error("Erro ao substituir carrinho:", error)
    } finally {
      setShowConflictDialog({ show: false, productId: "", conflictStore: "" })
    }
  }

  return (
    <div className="p-6 pt-20 lg:pt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Buscar Produtos</h1>
        <p className="text-gray-600 mt-2">Encontre os melhores produtos e preços</p>
      </div>

      {/* Search Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedStore} onValueChange={setSelectedStore}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Todas as lojas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as lojas</SelectItem>
              {mockStores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.logo} {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.description}</p>
                      <Badge variant="secondary" className="mt-1">
                        {product.category}
                      </Badge>
                    </div>
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{product.store.logo}</span>
                      <div>
                        <p className="text-sm font-medium">{product.store.name}</p>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs text-gray-500">{product.store.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">R$ {product.price.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">por {product.unit}</p>
                    </div>
                  </div>

                  <Button onClick={() => handleAddToCart(product.id)} disabled={!product.inStock} className="w-full">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {product.inStock ? "Adicionar ao Carrinho" : "Indisponível"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {products.length === 0 && searchTerm && !loading && (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">Tente buscar por outros termos</p>
        </div>
      )}

      {products.length === 0 && !searchTerm && (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Digite algo para buscar</h3>
          <p className="mt-1 text-sm text-gray-500">Use a barra de pesquisa acima para encontrar produtos</p>
        </div>
      )}

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
