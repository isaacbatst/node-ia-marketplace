"use client";

import { addToCart, getCatalog } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Product } from "@/types";
import { Search, ShoppingCart } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import useSWR from "swr";

export default function ProductsPage() {
  const params = useSearchParams();
  const search = params.get("q") || "";

  const products = useSWR<Product[]>(`/api/products?q=${search}`, () => getCatalog(search));

  const handleAddToCart = async (productId: number) => {
    await addToCart(productId, 1);
    toast.success("Produto adicionado ao carrinho");
  };

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
              onChange={(e) => {
                window.history.pushState({}, "", `?q=${e.target.value}`);
              }}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {products.isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.data?.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div>
                      <p className="text-sm font-medium">{product.store.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">R$ {(product.price / 100).toFixed(2)}</p>
                  </div>
                </div>

                <Button className="w-full" onClick={() => handleAddToCart(product.id)}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Adicionar ao Carrinho
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.data?.length === 0 && search && !products.isLoading && (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">Tente buscar por outros termos</p>
        </div>
      )}

      {products.data?.length === 0 && !search && (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Digite algo para buscar</h3>
          <p className="mt-1 text-sm text-gray-500">Use a barra de pesquisa acima para encontrar produtos</p>
        </div>
      )}
    </div>
  );
}
