import type { Product, Recipe, Plan, Cart, CartItem, ChatMessage, CartComparison, RecipeFile } from "./types"
import { mockProducts, mockStores, popularRecipes } from "./mockData"

// Dados mockados
const mockRecipes: Recipe[] = [
  {
    id: "1",
    title: "Macarrão com Carne Moída",
    description: "Delicioso macarrão com molho de carne moída",
    ingredients: ["500g macarrão", "300g carne moída", "1 cebola", "2 tomates", "molho de tomate"],
    instructions: ["Cozinhe o macarrão", "Refogue a carne", "Adicione o molho"],
    servings: 4,
    prepTime: "30 min",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    title: "Salada Caesar",
    description: "Salada fresca com molho caesar",
    ingredients: ["alface americana", "croutons", "queijo parmesão", "molho caesar"],
    instructions: ["Lave a alface", "Misture os ingredientes"],
    servings: 2,
    prepTime: "15 min",
    createdAt: new Date("2024-01-14"),
  },
]

const mockPlans: Plan[] = [
  {
    id: "1",
    title: "Plano Semanal Família",
    description: "Plano alimentar para família de 4 pessoas",
    days: [
      {
        day: "Segunda-feira",
        meals: [
          { id: "1", name: "Aveia com frutas", type: "breakfast", recipes: [] },
          { id: "2", name: "Macarrão com Carne", type: "lunch", recipes: ["1"] },
          { id: "3", name: "Salada Caesar", type: "dinner", recipes: ["2"] },
        ],
      },
    ],
    createdAt: new Date("2024-01-10"),
  },
]

const mockCarts: Cart[] = [
  {
    id: "1",
    items: [
      { id: "1", name: "Macarrão", quantity: 2, unit: "pacotes", price: 4.5, store: "Supermercado A" },
      { id: "2", name: "Carne Moída", quantity: 1, unit: "kg", price: 18.9, store: "Açougue B" },
    ],
    stores: ["Supermercado A", "Açougue B"],
    total: 27.9,
    createdAt: new Date("2024-01-16"),
  },
]

// Adicione após os dados mockados existentes
const uploadedRecipeFiles: RecipeFile[] = [
  {
    id: "file-1",
    name: "Receitas da Vovó",
    fileName: "receitas-vovo.pdf",
    uploadDate: new Date("2024-01-15"),
    size: 2048576, // 2MB
    url: "/placeholder.pdf",
  },
]

// Simular delay de rede
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const personalRecipes: Recipe[] = []
const userCarts: Cart[] = []

export async function searchProducts(query: string, storeId?: string): Promise<Product[]> {
  await delay(500)

  let filteredProducts = mockProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase()),
  )

  if (storeId) {
    filteredProducts = filteredProducts.filter((product) => product.store.id === storeId)
  }

  return filteredProducts
}

export async function getProductsByStore(storeId: string): Promise<Product[]> {
  await delay(300)
  return mockProducts.filter((product) => product.store.id === storeId)
}

export async function createPersonalRecipe(recipeData: Partial<Recipe>): Promise<Recipe> {
  await delay(800)

  const newRecipe: Recipe = {
    id: `personal-${Date.now()}`,
    title: recipeData.title || "Nova Receita",
    description: recipeData.description || "",
    ingredients: recipeData.ingredients || [],
    instructions: recipeData.instructions || [],
    servings: recipeData.servings || 1,
    prepTime: recipeData.prepTime || "30 min",
    difficulty: recipeData.difficulty || "easy",
    isPersonal: true,
    createdAt: new Date(),
  }

  personalRecipes.push(newRecipe)
  return newRecipe
}

export async function getAllRecipes(): Promise<Recipe[]> {
  await delay(400)
  return [...popularRecipes, ...personalRecipes]
}

export async function importPlanOrRecipe(fileOrText: string, type: "recipe" | "plan"): Promise<Recipe | Plan> {
  await delay(1500)

  if (type === "recipe") {
    const newRecipe: Recipe = {
      id: Date.now().toString(),
      title: "Receita Importada",
      description: "Receita importada do arquivo/texto",
      ingredients: ["ingrediente 1", "ingrediente 2"],
      instructions: ["passo 1", "passo 2"],
      servings: 4,
      prepTime: "30 min",
      createdAt: new Date(),
    }
    mockRecipes.push(newRecipe)
    return newRecipe
  } else {
    const newPlan: Plan = {
      id: Date.now().toString(),
      title: "Plano Importado",
      description: "Plano alimentar importado",
      days: [],
      createdAt: new Date(),
    }
    mockPlans.push(newPlan)
    return newPlan
  }
}

export async function fetchUserRecipes(): Promise<Recipe[]> {
  await delay(800)
  return mockRecipes
}

export async function fetchUserPlans(): Promise<Plan[]> {
  await delay(800)
  return mockPlans
}

export async function fetchUserCarts(): Promise<Cart[]> {
  await delay(600)
  return mockCarts
}

export async function generateCartFromRecipe(recipe: Recipe): Promise<CartComparison> {
  await delay(2000)

  const cartsByStore = mockStores.map((store) => {
    const storeProducts = mockProducts.filter((p) => p.store.id === store.id)
    const cartItems: CartItem[] = []
    let availableIngredients = 0

    recipe.ingredients.forEach((ingredient) => {
      const product = storeProducts.find((p) => p.name.toLowerCase().includes(ingredient.toLowerCase()) && p.inStock)

      if (product) {
        cartItems.push({
          id: `cart-item-${Date.now()}-${product.id}`,
          product,
          quantity: 1,
        })
        availableIngredients++
      }
    })

    const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const availability = (availableIngredients / recipe.ingredients.length) * 100

    return {
      store,
      items: cartItems,
      total,
      availability,
    }
  })

  // Sort by availability and price
  cartsByStore.sort((a, b) => {
    if (a.availability !== b.availability) {
      return b.availability - a.availability
    }
    return a.total - b.total
  })

  return {
    recipe,
    carts: cartsByStore,
  }
}

export async function addToCart(
  productId: string,
  quantity = 1,
): Promise<{ success: boolean; cart?: Cart; conflict?: boolean; conflictStore?: string }> {
  await delay(500)

  const product = mockProducts.find((p) => p.id === productId)
  if (!product) {
    return { success: false }
  }

  // Check if there's an existing cart with different store
  const existingCart = userCarts.find((cart) => cart.items.length > 0)

  if (existingCart && existingCart.store.id !== product.store.id) {
    return {
      success: false,
      conflict: true,
      conflictStore: existingCart.store.name,
    }
  }

  // Find or create cart for this store
  let cart = userCarts.find((c) => c.store.id === product.store.id)

  if (!cart) {
    cart = {
      id: `cart-${Date.now()}`,
      store: product.store,
      items: [],
      total: 0,
      createdAt: new Date(),
    }
    userCarts.push(cart)
  }

  // Check if product already in cart
  const existingItem = cart.items.find((item) => item.product.id === productId)

  if (existingItem) {
    existingItem.quantity += quantity
  } else {
    cart.items.push({
      id: `item-${Date.now()}`,
      product,
      quantity,
    })
  }

  // Recalculate total
  cart.total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  return { success: true, cart }
}

export async function clearCartAndAdd(productId: string, quantity = 1): Promise<{ success: boolean; cart?: Cart }> {
  await delay(500)

  // Clear all carts
  userCarts.length = 0

  // Add new product
  return addToCart(productId, quantity)
}

export async function getCurrentCart(): Promise<Cart | null> {
  await delay(200)
  return userCarts.find((cart) => cart.items.length > 0) || null
}

export async function removeFromCart(itemId: string): Promise<Cart | null> {
  await delay(300)

  const cart = userCarts.find((c) => c.items.some((item) => item.id === itemId))
  if (!cart) return null

  cart.items = cart.items.filter((item) => item.id !== itemId)
  cart.total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  return cart
}

export async function executeAction(actionType: string, payload: any): Promise<any> {
  await delay(1000)

  switch (actionType) {
    case "add_to_cart":
      return { success: true, message: "Item adicionado ao carrinho" }
    case "suggest_recipe":
      return { success: true, recipe: mockRecipes[0] }
    case "optimize_cart":
      return { success: true, message: "Carrinho otimizado" }
    default:
      return { success: false, message: "Ação não reconhecida" }
  }
}

export async function sendChatMessage(message: string): Promise<ChatMessage> {
  await delay(1200)

  const responses = [
    {
      content:
        "Ótima escolha! Posso sugerir adicionar molho de tomate e queijo parmesão para complementar sua receita de macarrão.",
      actions: [
        { id: "1", label: "Adicionar molho de tomate", type: "add_to_cart", payload: { item: "molho de tomate" } },
        { id: "2", label: "Adicionar queijo parmesão", type: "add_to_cart", payload: { item: "queijo parmesão" } },
      ],
    },
    {
      content:
        "Baseado no seu plano alimentar, sugiro otimizar suas compras comprando em apenas 2 supermercados para economizar tempo.",
      actions: [{ id: "3", label: "Otimizar carrinho", type: "optimize_cart", payload: {} }],
    },
    {
      content:
        "Que tal uma receita de sobremesa para complementar seu plano? Tenho uma sugestão de pudim de leite condensado!",
      actions: [{ id: "4", label: "Ver receita de pudim", type: "suggest_recipe", payload: { type: "dessert" } }],
    },
  ]

  const randomResponse = responses[Math.floor(Math.random() * responses.length)]

  return {
    id: Date.now().toString(),
    content: randomResponse.content,
    sender: "assistant",
    timestamp: new Date(),
    actions: randomResponse.actions,
  }
}

export async function processAIMessage(message: string): Promise<ChatMessage> {
  await delay(1500)

  const lowerMessage = message.toLowerCase()

  // PDF Upload detection
  if (lowerMessage.includes("upload") || lowerMessage.includes("pdf") || lowerMessage.includes("arquivo")) {
    return {
      id: Date.now().toString(),
      content:
        "Perfeito! Você pode fazer upload de arquivos PDF com suas receitas. Use o botão de upload abaixo ou vá para a página 'Minhas Receitas' para gerenciar seus arquivos.",
      sender: "assistant",
      timestamp: new Date(),
      type: "text",
    }
  }

  // Recipe suggestions
  if (lowerMessage.includes("receita") || lowerMessage.includes("cozinhar") || lowerMessage.includes("prato")) {
    const randomRecipe = popularRecipes[Math.floor(Math.random() * popularRecipes.length)]

    return {
      id: Date.now().toString(),
      content: `Que tal preparar ${randomRecipe.title}? É ${randomRecipe.difficulty === "easy" ? "fácil" : randomRecipe.difficulty === "medium" ? "médio" : "difícil"} de fazer e serve ${randomRecipe.servings} pessoas. Posso te ajudar a montar o carrinho com os ingredientes!`,
      sender: "assistant",
      timestamp: new Date(),
      type: "recipe",
      data: randomRecipe,
    }
  }

  // Product search
  if (lowerMessage.includes("produto") || lowerMessage.includes("comprar") || lowerMessage.includes("buscar")) {
    const products = await searchProducts("macarrão")

    return {
      id: Date.now().toString(),
      content: `Encontrei alguns produtos para você! Aqui estão as opções de macarrão disponíveis nas lojas:`,
      sender: "assistant",
      timestamp: new Date(),
      type: "product_suggestion",
      data: products.slice(0, 3),
    }
  }

  // Cart comparison
  if (
    lowerMessage.includes("comparar") ||
    lowerMessage.includes("melhor preço") ||
    lowerMessage.includes("mais barato")
  ) {
    const recipe = popularRecipes[0]
    const comparison = await generateCartFromRecipe(recipe)

    return {
      id: Date.now().toString(),
      content: `Comparei os preços para a receita "${recipe.title}" em todas as lojas. Aqui está o ranking:`,
      sender: "assistant",
      timestamp: new Date(),
      type: "cart_comparison",
      data: comparison,
    }
  }

  // Default responses
  const responses = [
    "Como posso te ajudar hoje? Posso sugerir receitas, buscar produtos ou comparar preços entre lojas!",
    "Estou aqui para te ajudar com suas compras! Que tal começarmos com uma receita deliciosa?",
    "Posso te ajudar a encontrar os melhores preços e montar seu carrinho de compras. O que você gostaria de cozinhar?",
    "Sou especialista em receitas e comparação de preços! Como posso tornar suas compras mais inteligentes hoje?",
  ]

  return {
    id: Date.now().toString(),
    content: responses[Math.floor(Math.random() * responses.length)],
    sender: "assistant",
    timestamp: new Date(),
    type: "text",
  }
}

// Adicione essas novas funções
export async function uploadRecipeFile(file: File): Promise<RecipeFile> {
  await delay(2000)

  const newFile: RecipeFile = {
    id: `file-${Date.now()}`,
    name: file.name.replace(".pdf", ""),
    fileName: file.name,
    uploadDate: new Date(),
    size: file.size,
    url: `/uploads/${file.name}`,
  }

  uploadedRecipeFiles.push(newFile)
  return newFile
}

export async function getRecipeFiles(): Promise<RecipeFile[]> {
  await delay(500)
  return uploadedRecipeFiles
}

export async function deleteRecipeFile(fileId: string): Promise<boolean> {
  await delay(800)

  const index = uploadedRecipeFiles.findIndex((f) => f.id === fileId)
  if (index > -1) {
    uploadedRecipeFiles.splice(index, 1)
    return true
  }
  return false
}

export async function applyCartFromComparison(storeId: string, recipeId: string): Promise<Cart> {
  await delay(1500)

  const store = mockStores.find((s) => s.id === storeId)
  const recipe = popularRecipes.find((r) => r.id === recipeId)

  if (!store || !recipe) {
    throw new Error("Loja ou receita não encontrada")
  }

  // Clear existing carts
  userCarts.length = 0

  // Create new cart based on recipe and store
  const storeProducts = mockProducts.filter((p) => p.store.id === storeId)
  const cartItems: CartItem[] = []

  recipe.ingredients.forEach((ingredient) => {
    const product = storeProducts.find((p) => p.name.toLowerCase().includes(ingredient.toLowerCase()) && p.inStock)

    if (product) {
      cartItems.push({
        id: `cart-item-${Date.now()}-${product.id}`,
        product,
        quantity: 1,
      })
    }
  })

  const newCart: Cart = {
    id: `cart-${Date.now()}`,
    store,
    items: cartItems,
    total: cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    createdAt: new Date(),
  }

  userCarts.push(newCart)
  return newCart
}
