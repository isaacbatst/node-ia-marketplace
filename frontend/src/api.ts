import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
})

export const fetchProducts = async () => {
  const response = await api.get("/catalog");
  return response.data;
};