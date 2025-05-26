import axios from "axios";
import { Product } from "./types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
})

export const getCatalog = async (search = '') => {
  const response = await api.get('/catalog', {
    params: { search },
  });
  return response.data as Product[];
}