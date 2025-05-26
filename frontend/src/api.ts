import axios from "axios";
import { Cart, Product } from "./types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
})

export const getCatalog = async (search = '') => {
  const response = await api.get('/catalog', {
    params: { search },
  });
  return response.data as Product[];
}

export const getCart = async () => {
  const response = await api.get('/cart');
  return response.data as Cart;
}

export const addToCart = async (productId: number, quantity: number) => {
  const response = await api.post('/cart', {
    productId,
    quantity,
  });
  return response.data as { id: number };
}

export const updateCartItemQuantity = async (cartId: number, productId: number, quantity: number) => {
  const response = await api.put(`/cart/${cartId}/items/${productId}`, {
    quantity,
  });
  return response.data as Cart;
}

export const removeCartItem = async (cartId: number, productId: number) => {
  await api.delete(`/cart/${cartId}/items/${productId}`);
}