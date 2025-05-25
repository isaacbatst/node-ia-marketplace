export interface Product {
  id: number
  name: string
  price: number
  store: Store
}

export interface Store {
  id: number
  name: string
}

export interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

export interface Cart {
  id: number
  store: Store
  items: CartItem[]
  total: number
  createdAt: Date
}

export interface ChatMessage {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
  type?: "text" | "recipe" | "cart_comparison" | "product_suggestion"
  data?: unknown
}

export interface CartComparison {
  carts: {
    store: Store
    items: CartItem[]
    total: number
    availability: number // percentage of items available
  }[]
}

export interface RecipeFile {
  id: string
  name: string
  fileName: string
  uploadDate: Date
  size: number
  url: string
}
