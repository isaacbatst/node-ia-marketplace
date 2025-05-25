import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
})

export const fetchProducts = async (q: string) => {
  const searchParams = new URLSearchParams();
  if (q) {
    searchParams.append("q", q);
  }

  const response = await api.get("/catalog?" + searchParams.toString());
  return response.data;
};

export const addToCart = async (productId: number, quantity: number) => {
  const response = await api.post("/shopping/cart", {
    productId,
    quantity,
  });
  return response.data;
}

export const getCart = async () => {
  const response = await api.get("/shopping/cart");
  return response.data;
};

export const updateCartItem = async (
  cartId: number,
  productId: number,
  quantity: number,
) => {
  const response = await api.put(`/shopping/cart/${cartId}/items/${productId}`, {
    quantity,
  });
  return response.data;
}

export const removeCartItem = async (
  cartId: number,
  productId: number,
) => {
  const response = await api.delete(
    `/shopping/cart/${cartId}/items/${productId}`,
  );
  return response.data;
}