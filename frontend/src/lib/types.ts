export interface Product {
  id: string
  name: string
  price: number
  store: Store
}

export interface Store {
  id: string
  name: string
}

export interface CartItem {
  id: string
  product: Product
  quantity: number
}

export interface Cart {
  id: string
  store: Store
  items: CartItem[]
  total: number
  createdAt: Date
}

export interface Recipe {
  id: string
  title: string
  description: string
  ingredients: string[]
  instructions: string[]
  servings: number
  prepTime: string
  difficulty: "easy" | "medium" | "hard"
  isPersonal: boolean
  createdAt: Date
}

export interface ChatMessage {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
  type?: "text" | "recipe" | "cart_comparison" | "product_suggestion"
  data?: any
}

export interface CartComparison {
  recipe: Recipe
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
