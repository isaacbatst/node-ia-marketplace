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